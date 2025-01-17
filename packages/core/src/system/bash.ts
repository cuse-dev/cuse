import {
  GetProcessOutputParams,
  SystemConfig,
  TerminateProcessParams,
} from './types';
import * as client from './client';
import {
  BashInterface,
  ExecuteCommandParams,
  CommandResponse,
  ProcessInfo,
} from './types';
import { handleResponse } from './utils';

/**
 * Bash control implementation
 * Provides functionality for executing shell commands and managing processes
 */
export class Bash implements BashInterface {
  constructor(private config: SystemConfig) {}

  /**
   * Execute a shell command
   * @param params Parameters containing the command to execute
   * @returns Promise with the command response (output or process ID)
   * @throws Error if command execution fails
   */
  async execute({ command }: ExecuteCommandParams): Promise<CommandResponse> {
    const response = await handleResponse(
      client
        .bashExecuteCommand({
          body: { command },
        })
        .catch((error) => {
          console.error(error);
          throw new Error(`Command execution failed: ${error.message}`);
        })
    );

    if (!response) {
      throw new Error('Command execution failed');
    }

    if (response.status === 'completed' && response.output) {
      return {
        ...response,
        output: this.formatOutput(response.output),
      };
    }

    return response;
  }

  /**
   * Get output from a background process
   * @param pid Process ID
   * @returns Promise with the process output
   * @throws Error if process not found or output retrieval fails
   */
  async getProcessOutput({
    pid,
  }: GetProcessOutputParams): Promise<CommandResponse> {
    const response = await handleResponse(
      client
        .bashGetProcessOutput({
          path: {
            pid,
          },
        })
        .catch((error) => {
          console.error(error);
          throw new Error(`Failed to get process output: ${error.message}`);
        })
    );

    if (!response) {
      throw new Error('Failed to get process output');
    }

    if (response.output) {
      return {
        ...response,
        output: this.formatOutput(response.output),
      };
    }

    return response;
  }

  /**
   * Terminate a background process
   * @param params Parameters containing the process ID
   * @throws Error if process termination fails
   */
  async terminateProcess({ pid }: TerminateProcessParams): Promise<void> {
    await handleResponse(
      client
        .bashTerminateProcess({
          path: {
            pid,
          },
        })
        .catch((error) => {
          console.error(error);
          throw new Error(`Failed to terminate process: ${error.message}`);
        })
    );
  }

  /**
   * List all processes managed by the API
   * @returns Promise with list of managed processes
   * @throws Error if listing fails
   */
  async listManagedProcesses(): Promise<ProcessInfo[]> {
    const response = await handleResponse(
      client.bashListManagedProcesses().catch((error) => {
        console.error(error);
        throw new Error(`Failed to list managed processes: ${error.message}`);
      })
    );

    return response?.processes || [];
  }

  /**
   * List all system processes
   * @returns Promise with list of system processes
   * @throws Error if listing fails
   */
  async listSystemProcesses(): Promise<ProcessInfo[]> {
    const response = await handleResponse(
      client.bashListSystemProcesses().catch((error) => {
        console.error(error);
        throw new Error(`Failed to list system processes: ${error.message}`);
      })
    );

    return response?.processes || [];
  }

  /**
   * Restart the system
   * @throws Error if restart fails
   */
  async restart(): Promise<void> {
    await handleResponse(
      client.bashRestartSystem({
        body: {},
      })
    );
  }

  /**
   * Formats the output string, showing first and last 500 characters for long outputs
   * @param output The output string to format
   * @returns Formatted output string, with "..." in the middle if truncated
   */
  private formatOutput(output: string): string {
    if (output.length <= 1000) {
      return output;
    }
    const start = output.slice(0, 500);
    const end = output.slice(-500);
    return `${start}\n...\n${end}`;
  }
}
