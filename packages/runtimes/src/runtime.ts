import { EventEmitter } from "node:events";
import {
	type BaseRuntimeConfig,
	type RuntimeCapabilities,
	type RuntimeConnectionOptions,
	type RuntimeEvent,
	RuntimeEventType,
	type RuntimeMetrics,
	RuntimeStatus,
} from "./types";

/**
 * Log options for retrieving runtime instance logs
 */
export interface RuntimeLogOptions {
	/** Number of lines to retrieve from the end of logs. If not specified, returns all logs */
	tail?: number;
	/** Whether to follow the log output */
	follow?: boolean;
	/** Timestamp to retrieve logs since (ISO string or Date) */
	since?: string | Date;
	/** Whether to include timestamps in the log output */
	timestamps?: boolean;
}

/**
 * Interface for container lifecycle management
 */
export interface Runtime {
	readonly id: string;
	readonly name: string;
	readonly status: RuntimeStatus;
	readonly config: BaseRuntimeConfig;
	readonly capabilities: RuntimeCapabilities;

	// Lifecycle methods
	start(): Promise<void>;
	stop(): Promise<void>;
	restart(): Promise<void>;
	terminate(): Promise<void>;

	// Status and metrics
	getStatus(): Promise<RuntimeStatus>;
	getMetrics(): Promise<RuntimeMetrics>;

	// Logs
	getLogs(options?: RuntimeLogOptions): Promise<string>;
	followLogs(
		onData: (data: string) => void,
		onError: (error: Error) => void,
		options?: Omit<RuntimeLogOptions, "follow">,
	): Promise<() => void>;

	// Event handling
	on(event: RuntimeEventType, listener: (event: RuntimeEvent) => void): void;
	off(event: RuntimeEventType, listener: (event: RuntimeEvent) => void): void;
}

/**
 * Abstract base class for container providers
 * Implements common functionality that all providers should have
 */
export abstract class BaseRuntime extends EventEmitter implements Runtime {
	private _status: RuntimeStatus = RuntimeStatus.CREATING;
	private _metrics: RuntimeMetrics = {
		cpuUsagePercent: 0,
		memoryUsageMb: 0,
		networkInBytes: 0,
		networkOutBytes: 0,
		diskUsageBytes: 0,
	};

	readonly config: BaseRuntimeConfig;
	protected readonly connectionOptions: RuntimeConnectionOptions;

	constructor(
		config: BaseRuntimeConfig,
		connectionOptions?: RuntimeConnectionOptions,
	) {
		super();
		this.config = config;
		this.connectionOptions = connectionOptions ?? {};
	}

	get id(): string {
		return this.config.id;
	}

	get name(): string {
		return this.config.name;
	}

	get status(): RuntimeStatus {
		return this._status;
	}

	abstract get capabilities(): RuntimeCapabilities;

	/**
	 * Start the container
	 */
	abstract start(): Promise<void>;

	/**
	 * Stop the container
	 */
	abstract stop(): Promise<void>;

	/**
	 * Restart the container
	 */
	async restart(): Promise<void> {
		await this.stop();
		await this.start();
	}

	/**
	 * Terminate and cleanup the container
	 */
	abstract terminate(): Promise<void>;

	/**
	 * Get current container status
	 */
	async getStatus(): Promise<RuntimeStatus> {
		return this._status;
	}

	/**
	 * Get current container metrics
	 */
	async getMetrics(): Promise<RuntimeMetrics> {
		return this._metrics;
	}

	/**
	 * Get container logs
	 */
	abstract getLogs(options?: RuntimeLogOptions): Promise<string>;

	/**
	 * Follow container logs
	 * Returns a function to stop following logs
	 */
	abstract followLogs(
		onData: (data: string) => void,
		onError: (error: Error) => void,
		options?: Omit<RuntimeLogOptions, "follow">,
	): Promise<() => void>;

	/**
	 * Update container status and emit event
	 */
	protected updateStatus(newStatus: RuntimeStatus): void {
		const oldStatus = this._status;
		this._status = newStatus;

		this.emit(RuntimeEventType.STATUS_CHANGED, {
			type: RuntimeEventType.STATUS_CHANGED,
			timestamp: new Date(),
			data: {
				oldStatus,
				newStatus,
			},
		});
	}

	/**
	 * Update container metrics and emit event
	 */
	protected updateMetrics(metrics: Partial<RuntimeMetrics>): void {
		this._metrics = {
			...this._metrics,
			...metrics,
		};

		this.emit(RuntimeEventType.METRICS_UPDATED, {
			type: RuntimeEventType.METRICS_UPDATED,
			timestamp: new Date(),
			data: this._metrics,
		});
	}
}
