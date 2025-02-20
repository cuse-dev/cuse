import type { BrowserController } from './browser';

interface CommandParams {
  command: string;
}

interface ProcessInfo {
  pid: number;
  command: string;
  status: string;
  output?: string;
}

interface CommandResponse {
  output?: string;
  process_id?: number;
  status: 'completed' | 'background';
}

export class BashController {
  private processes: Map<number, ProcessInfo> = new Map();
  private nextPid = 1;

  constructor(private browserController: BrowserController) {}

  async executeCommand({ command }: CommandParams): Promise<Response> {
    const page = await this.browserController.getPage();

    try {
      // Execute command in browser context
      const result = await page.evaluate(async (cmd) => {
        try {
          // Execute command and capture output
          const output = await eval(cmd);
          return {
            output: String(output),
            status: 'completed',
          };
        } catch (error) {
          return {
            output: error instanceof Error ? error.message : String(error),
            status: 'completed',
          };
        }
      }, command);

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(
        JSON.stringify({
          error:
            error instanceof Error
              ? error.message
              : 'Failed to execute command',
          status: 'completed',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  }

  async getProcessOutput(pid: number): Promise<Response> {
    const process = this.processes.get(pid);
    if (!process) {
      return new Response(JSON.stringify({ error: 'Process not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({
        output: process.output,
        process_id: process.pid,
        status: process.status,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  async terminateProcess(pid: number): Promise<Response> {
    if (!this.processes.has(pid)) {
      return new Response(JSON.stringify({ error: 'Process not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    this.processes.delete(pid);
    return new Response(null, { status: 204 });
  }

  async listManagedProcesses(): Promise<Response> {
    return new Response(JSON.stringify(Array.from(this.processes.values())), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
