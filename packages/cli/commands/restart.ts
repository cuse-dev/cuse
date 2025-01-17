import type { Arguments, Argv } from 'yargs';
import type { BaseOptions, CommandModule } from './types';
import { configExists, getComputer, getAllComputers } from '../utils/project';
import { removeComputer, startComputer } from '../utils/docker';
import { printComputerTable } from '../utils/print';
import ora from 'ora';

interface RestartOptions extends BaseOptions {
  identifier?: string;
}

export const restartCommand: CommandModule<RestartOptions> = {
  command: 'restart [identifier]',
  describe:
    'Perform a full stop and clean restart of a computer or all computers',
  builder: (yargs) => {
    return yargs.positional('identifier', {
      type: 'string',
      description:
        'Name of the computer to restart (optional, restarts all if not specified)',
    }) as Argv<RestartOptions>;
  },
  async handler(argv: Arguments<RestartOptions>) {
    const { identifier } = argv;

    if (!configExists()) {
      console.error('No cuse configuration found in this directory.');
      console.info("Run 'cuse init' to initialize a new configuration.");
      process.exit(1);
    }

    if (identifier) {
      // Restart specific computer
      const computer = getComputer(identifier);
      if (!computer) {
        console.error(`Computer "${identifier}" not found in configuration.`);
        process.exit(1);
      }

      const spinner = ora(`Restarting computer "${identifier}"...`).start();

      try {
        spinner.text = 'Removing existing container...';
        await removeComputer(identifier);

        spinner.text = 'Starting fresh container...';
        const newComputer = await startComputer(computer.os, identifier);

        spinner.succeed('Computer restarted successfully');
        console.info(`\nComputer "${identifier}" is ready:`);
        printComputerTable([newComputer]);
      } catch (error: any) {
        spinner.fail('Failed to restart computer');
        console.error(`Error: ${error?.message || 'Unknown error'}`);
        process.exit(1);
      }
    } else {
      // Restart all computers
      const computers = getAllComputers();
      if (computers.length === 0) {
        console.info('No computers found in configuration.');
        console.info("Use 'cuse new' to create a new computer.");
        return;
      }

      console.info(`Restarting all computers (${computers.length} found)...`);
      const restartedComputers = [];

      for (const computer of computers) {
        const spinner = ora(`Restarting "${computer.identifier}"...`).start();

        try {
          spinner.text = 'Removing existing container...';
          await removeComputer(computer.identifier);

          spinner.text = 'Starting fresh container...';
          const newComputer = await startComputer(
            computer.os,
            computer.identifier
          );

          spinner.succeed(
            `Computer "${computer.identifier}" restarted successfully`
          );
          restartedComputers.push(newComputer);
        } catch (error: any) {
          spinner.fail(`Failed to restart "${computer.identifier}"`);
          console.error(`Error: ${error?.message || 'Unknown error'}`);
        }
      }

      if (restartedComputers.length > 0) {
        console.info('\nRestarted computers:');
        printComputerTable(restartedComputers);
      }

      if (restartedComputers.length < computers.length) {
        console.warn(
          `\nWarning: ${computers.length - restartedComputers.length} computer(s) failed to restart`
        );
        process.exit(1);
      }
    }
  },
};
