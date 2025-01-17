import type { Arguments, Argv } from 'yargs';
import type { BaseOptions, CommandModule } from './types';
import { startComputer } from '../utils/docker';
import { configExists, getAllComputers } from '../utils/project';
import { printComputerTable } from '../utils/print';
import { setupProxy } from '../utils/proxy';

interface StartOptions extends BaseOptions {
  identifier?: string;
  detached?: boolean;
  force?: boolean;
  config?: string;
}

export const startCommand: CommandModule<StartOptions> = {
  command: 'start [identifier]',
  describe:
    'Start computers in the current project or a specific computer by identifier',
  builder: (yargs) => {
    return yargs
      .positional('identifier', {
        type: 'string',
        description: 'Optional identifier of a specific computer to start',
      })
      .option('detached', {
        type: 'boolean',
        description: 'Run the computers in the background',
      })
      .option('force', {
        type: 'boolean',
        description: 'Force a restart if already running',
      })
      .option('config', {
        type: 'string',
        description: 'Path to a custom config file',
      }) as Argv<StartOptions>;
  },
  async handler(argv: Arguments<StartOptions>) {
    const { identifier, force, config }: StartOptions = argv;

    if (config) {
      console.info(`Using custom config file: ${config}`);
    }

    if (!configExists(config)) {
      console.error('No cuse configuration found in this directory.');
      console.info("Run 'cuse init' to initialize a new configuration.");
      process.exit(1);
    }

    // Set up proxy first
    await setupProxy();

    // If an identifier is provided, start that specific computer
    if (identifier) {
      console.info(`Starting computer ${identifier}...`);
      try {
        const computer = await startComputer('linux', identifier);
        console.info(`\nComputer started!`);
        console.info(`Container: ${computer.containerId}`);
        console.info(`API: ${computer.api || 'No API URL available'}`);
        console.info(`noVNC: ${computer.novnc || 'No noVNC URL available'}`);
        console.info(`VNC: ${computer.api}/vnc || "No VNC URL available"`);
        printComputerTable([computer]);
        return;
      } catch (error: any) {
        console.error(
          `Failed to start computer ${identifier}: ${
            error?.message || 'Unknown error'
          }`
        );
        process.exit(1);
      }
    }

    // Otherwise, start all computers from config
    const configComputers = getAllComputers();
    if (configComputers.length === 0) {
      console.info('No computers found in configuration.');
      console.info("Use 'cuse new' to create a new computer.");
      return;
    }

    console.info('Starting all computers...');
    const startedComputers = [];

    for (const computer of configComputers) {
      const { identifier, os } = computer;
      console.info(`\nStarting ${os} Computer (${identifier})`);

      try {
        const startedComputer = await startComputer(os, identifier);
        console.info(`Container: ${startedComputer.containerId}`);
        console.info(`API: ${startedComputer.api || 'No API URL available'}`);
        console.info(
          `noVNC: ${startedComputer.novnc || 'No noVNC URL available'}`
        );
        console.info(
          `VNC: ${startedComputer.api}/vnc || "No VNC URL available"`
        );
        startedComputers.push(startedComputer);
      } catch (error: any) {
        console.error(
          `Failed to start computer ${identifier}: ${
            error?.message || 'Unknown error'
          }`
        );
      }
    }

    if (startedComputers.length > 0) {
      console.info('\nStarted computers:');
      printComputerTable(startedComputers);
    }
  },
};
