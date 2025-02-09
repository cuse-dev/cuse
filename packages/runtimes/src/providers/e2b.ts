import { EventEmitter } from "node:events";
import { Sandbox, type SandboxOpts } from "@e2b/code-interpreter";
import { BaseRuntimeProvider } from "src/provider";
import { v4 as uuidv4 } from "uuid";
import {
	type Platform,
	PlatformNotFoundError,
	type RuntimeCreationOptions,
} from "../platform";
import { BaseRuntime, type RuntimeLogOptions } from "../runtime";
import {
	type RuntimeCapabilities,
	type RuntimeConnectionOptions,
	RuntimeError,
	RuntimeStatus,
} from "../types";

export class E2BRuntime extends BaseRuntime {
	sandbox: Sandbox | null = null;
	private readonly platform: Platform;
	private logBuffer: string[] = [];
	private readonly maxLogBufferSize = 1000;
	private readonly emitter = new EventEmitter();

	private readonly logger = {
		debug: (message: string) => {
			this.logBuffer.push(message);
			this.emitter.emit("log", { message, level: "debug" });
		},
		info: (message: string) => {
			this.logBuffer.push(message);
			this.emitter.emit("log", { message, level: "info" });
		},
		error: (message: string) => {
			this.logBuffer.push(message);
			this.emitter.emit("log", { message, level: "error" });
		},
	};

	constructor(
		platform: Platform,
		config: RuntimeCreationOptions["config"],
		connectionOptions?: RuntimeConnectionOptions,
	) {
		const containerConfig = {
			id: `${platform.id}-${uuidv4()}`,
			name: `${platform.name}`,
			memoryMb: config?.memoryMb ?? platform.defaultResources?.memoryMb ?? 2048,
			cpuCount: config?.cpuCount ?? platform.defaultResources?.cpuCount ?? 2,
			// 5 minutes in ms
			timeoutMs: config?.timeoutMs ?? 300000,
			env: config?.env ?? {},
			metadata: {
				platformId: platform.id,
				platformVersion: platform.version,
				...config?.metadata,
			},
		};

		super(containerConfig, connectionOptions);
		this.platform = platform;

		if (!process.env.E2B_API_KEY) {
			throw new Error("E2B_API_KEY must be set");
		}
	}

	get capabilities(): RuntimeCapabilities {
		return {
			supportsGpu: false,
			supportsCustomImages: false, // E2B uses predefined templates
			supportsFileSystem: true,
			supportsNetworking: true,
			maxMemoryMb: 8192, // 8GB max for E2B sandboxes
			maxCpuCount: 4, // 4 CPU cores max
			maxTimeoutMs: 3600000, // 1 hour max runtime
		};
	}

	async start(): Promise<void> {
		try {
			if (!process.env.E2B_API_KEY) {
				throw new Error("E2B_API_KEY must be set");
			}

			const sandboxCreateOptions: SandboxOpts = {
				logger: this.logger,
				timeoutMs: this.config.timeoutMs,
				apiKey: process.env.E2B_API_KEY,
				...(this.config.env && { envs: this.config.env }),
			};

			// Create new E2B sandbox instance
			if (this.platform.image) {
				this.sandbox = await Sandbox.create(
					this.platform.image,
					sandboxCreateOptions,
				);
			} else {
				this.sandbox = await Sandbox.create(
					"ubuntu:24.04",
					sandboxCreateOptions,
				);
			}

			if (!this.sandbox) {
				throw new Error("Failed to create sandbox");
			}

			// Set environment variables if any
			if (this.config.env) {
				for (const [key, value] of Object.entries(this.config.env)) {
					await this.sandbox.commands.run(`export ${key}=${value}`);
				}
			}

			if (this.config.metadata?.command) {
				const out = await this.sandbox.commands.run(
					this.config.metadata.command,
				);

				if (out.stderr) {
					this.logger.error(out.stderr);
				}

				if (out.stdout) {
					this.logger.info(out.stdout);
				}
			}

			await this.sandbox.setTimeout(300000);

			this.logger.info("Starting virtual display...");

			await this.sandbox.commands.run("./start_all.sh", {
				onStderr: (data) => {
					this.logger.error(data);
					//throw new Error(data);
				},
				onStdout: (data) => {
					this.logger.info(`stdout: ${data}`);
				},
				timeoutMs: 300000,
				background: true,
			});

			this.logger.info("Starting computer api...");
			await this.sandbox.commands.run("./entrypoint.sh", {
				onStderr: (data) => {
					this.logger.error(data);
					//throw new Error(data);
				},
				onStdout: (data) => {
					this.logger.info(`stdout: ${data}`);
				},
				background: true,
				requestTimeoutMs: 300000,
			});

			await new Promise((resolve) =>
				this.followLogs(
					(data) => {
						if (data.includes("All services started successfully")) {
							resolve(true);
						}
					},
					(_error) => {},
				),
			);

			this.updateStatus(RuntimeStatus.RUNNING);

			// // Start metrics collection
			this.startMetricsCollection();
		} catch (error) {
			console.log("error");
			console.log(error);

			this.updateStatus(RuntimeStatus.ERROR);
			throw new RuntimeError(
				`Failed to start E2B sandbox: ${(error as Error).message}`,
				"E2B_START_ERROR",
			);
		}
	}

	async stop(): Promise<void> {
		if (!this.sandbox) return;

		try {
			await this.sandbox.kill();
			this.updateStatus(RuntimeStatus.TERMINATED);
		} catch (error) {
			this.updateStatus(RuntimeStatus.ERROR);
			throw new RuntimeError(
				`Failed to stop E2B sandbox: ${(error as Error).message}`,
				"E2B_STOP_ERROR",
			);
		}
	}

	async terminate(): Promise<void> {
		if (!this.sandbox) {
			this.updateStatus(RuntimeStatus.TERMINATED);
			return;
		}

		try {
			await this.sandbox.kill();
			this.updateStatus(RuntimeStatus.TERMINATED);
		} catch (error) {
			this.updateStatus(RuntimeStatus.ERROR);
			throw new RuntimeError(
				`Failed to terminate E2B sandbox: ${(error as Error).message}`,
				"E2B_TERMINATE_ERROR",
			);
		}
	}

	async getLogs(options?: RuntimeLogOptions): Promise<string> {
		if (!this.sandbox) {
			throw new RuntimeError(
				"Cannot get logs: sandbox not started",
				"E2B_LOGS_ERROR",
			);
		}

		try {
			const logs = this.logBuffer.join("\n");
			return options?.tail
				? logs.split("\n").slice(-options.tail).join("\n")
				: logs;
		} catch (error) {
			throw new RuntimeError(
				`Failed to get E2B sandbox logs: ${(error as Error).message}`,
				"E2B_LOGS_ERROR",
			);
		}
	}

	async followLogs(
		onData: (data: string) => void,
		onError: (error: Error) => void,
	): Promise<() => void> {
		if (!this.sandbox) {
			throw new RuntimeError(
				"Cannot follow logs: sandbox not started",
				"E2B_LOGS_ERROR",
			);
		}

		try {
			// Set up log listener
			const listener = (message: { message: string; level: string }) => {
				if (message.level === "error") {
					onError(new Error(message.message));
				} else {
					onData(message.message);
				}
			};

			this.emitter.on("log", listener);

			// Return cleanup function
			return () => {
				this.emitter.off("log", listener);
			};
		} catch (error) {
			throw new RuntimeError(
				`Failed to follow E2B sandbox logs: ${(error as Error).message}`,
				"E2B_LOGS_ERROR",
			);
		}
	}

	private async startMetricsCollection(): Promise<void> {
		if (!this.sandbox) return;

		const updateInterval = this.connectionOptions?.metricsInterval ?? 15000;

		// biome-ignore lint/style/useConst: <explanation>
		let interval: NodeJS.Timer;

		const collectMetrics = async () => {
			try {
				if (!this.sandbox) {
					clearInterval(interval);
					return;
				}

				// TODO: Get metrics from sandbox via API
				const metricsCpu = 0;
				const metricsMemory = 0;
				const metricsNetwork = 0;
				const metricsDisk = 0;

				this.updateMetrics({
					cpuUsagePercent: metricsCpu,
					memoryUsageMb: metricsMemory,
					networkInBytes: metricsNetwork,
					networkOutBytes: metricsNetwork,
					diskUsageBytes: metricsDisk,
				});
			} catch (error) {
				// Reset metrics on error
				this.updateMetrics({
					cpuUsagePercent: 0,
					memoryUsageMb: 0,
					networkInBytes: 0,
					networkOutBytes: 0,
					diskUsageBytes: 0,
				});
			}
		};

		// Start periodic collection
		interval = setInterval(collectMetrics, updateInterval);

		// Clean up interval when sandbox is terminated
		this.once("status_changed", (event) => {
			if (
				event.data.newStatus === RuntimeStatus.TERMINATED ||
				event.data.newStatus === RuntimeStatus.ERROR ||
				event.data.newStatus === RuntimeStatus.STOPPED
			) {
				clearInterval(interval);
			}
		});

		// Initial collection
		await collectMetrics().catch(() => {
			// Ignore initial collection errors
		});
	}
}

export class E2BRuntimeProvider extends BaseRuntimeProvider<E2BRuntime> {
	async createInstance(options: RuntimeCreationOptions): Promise<E2BRuntime> {
		const platform = this.getPlatform(options.platformId);
		if (!platform) {
			throw new PlatformNotFoundError(options.platformId);
		}

		return new E2BRuntime(platform, options.config);
	}
}

export function createE2BProvider(
	platforms: Platform[],
	defaultPlatformId: string,
): E2BRuntimeProvider {
	return new E2BRuntimeProvider({
		platforms,
		defaultPlatform: defaultPlatformId,
	});
}
