import * as client from './client';
import type {
  BashInterface,
  CommandResponse,
  ExecuteCommandParams,
  GetProcessOutputParams,
  ProcessInfo,
  SystemConfig,
  TerminateProcessParams,
} from './types';

/**
 * Bash control implementation
 * Provides functionality for executing shell commands and managing processes
 */
export class Bash implements BashInterface {
  constructor(private config: SystemConfig) {}

  /**
   * Execute a shell command
   * @param params Command execution parameters
   * @returns Promise with command execution response
   * @throws Error if command execution fails
   */
  async execute({ command }: ExecuteCommandParams): Promise<CommandResponse> {
    const response = await client.executeCommand({
      body: { command },
    });

    if (!response.data) {
      throw new Error('Failed to execute command');
    }

    // Ensure the status is one of our expected values
    const status =
      response.data.status === 'background' ? 'background' : 'completed';
    return {
      ...response.data,
      status,
    } as CommandResponse;
  }

  /**
   * Get output from a background process
   * @param params Process output parameters
   * @returns Promise with process output response
   * @throws Error if getting process output fails
   */
  async getProcessOutput({
    pid,
  }: GetProcessOutputParams): Promise<CommandResponse> {
    const response = await client.getProcessOutput({
      path: { pid },
    });

    if (!response.data) {
      throw new Error('Failed to get process output');
    }

    // Ensure the status is one of our expected values
    const status =
      response.data.status === 'background' ? 'background' : 'completed';
    return {
      ...response.data,
      status,
    } as CommandResponse;
  }

  /**
   * Terminate a background process
   * @param params Process termination parameters
   * @throws Error if process termination fails
   */
  async terminateProcess({ pid }: TerminateProcessParams): Promise<void> {
    await client.terminateProcess({
      path: { pid },
    });
  }

  /**
   * List all processes managed by the API
   * @returns Promise with list of managed processes
   * @throws Error if listing fails
   */
  async listManagedProcesses(): Promise<ProcessInfo[]> {
    const response = await client.listManagedProcesses();

    if (!response.data) {
      throw new Error('Failed to list managed processes');
    }

    return response.data as ProcessInfo[];
  }

  /**
   * Restart the system
   * @throws Error if restart fails
   */
  async restart(): Promise<void> {
    await client.restartSystem({
      body: {},
    });
  }
}
