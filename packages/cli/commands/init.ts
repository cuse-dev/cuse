import type { Arguments, Argv } from 'yargs';
import inquirer from 'inquirer';
import type { BaseOptions, CommandModule } from './types';
import {
  configExists,
  writeConfig,
  type CuseConfig,
  getAllComputers,
  addComputer,
} from '../utils/project';
import { setupProxy } from '../utils/proxy';
import { PROXY_PORT } from '../config';
import { startComputer } from '../utils/docker';
import { chooseOS, chooseIdentifier } from './utils';
import { printComputerTable } from '../utils/print';

interface InitOptions extends BaseOptions {
  force?: boolean;
  yes?: boolean;
}

export const initCommand: CommandModule<InitOptions> = {
  command: 'init',
  describe: 'Initialize cuse in an existing project',
  builder: (yargs) => {
    return yargs
      .option('force', {
        alias: 'f',
        type: 'boolean',
        description: 'Force the initialization process',
      })
      .option('yes', {
        alias: 'y',
        type: 'boolean',
        description: 'Skip confirmation prompts',
      }) as Argv<InitOptions>;
  },
  async handler(argv: Arguments<InitOptions>) {
    const { force, yes } = argv;

    if (configExists() && !force) {
      console.error('A cuse configuration already exists in this directory.');
      console.info('Use --force to overwrite the existing configuration.');
      process.exit(1);
    }

    if (!yes) {
      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: 'Initialize cuse in the current directory?',
          default: true,
        },
      ]);

      if (!confirm) {
        console.info('Operation cancelled.');
        return;
      }
    }

    const defaultProjectName = process.cwd().split('/').pop();
    const { projectName, description } = await inquirer.prompt([
      {
        type: 'input',
        name: 'projectName',
        message: 'Project name:',
        ...(defaultProjectName ? { default: defaultProjectName } : {}),
      },
      {
        type: 'input',
        name: 'description',
        message: 'Project description (optional):',
      },
    ]);

    const config: CuseConfig = {
      version: '1.0.0',
      project: {
        name: projectName,
        description: description || undefined,
      },
      computers: [],
    };

    // Set up proxy
    await setupProxy();

    // Write main config
    writeConfig(config);
    console.info('\nInitialized cuse configuration in cuse.config.yml');

    // Check if we need to create a new computer
    const computers = getAllComputers();
    if (computers.length === 0) {
      console.info('\nNo computers found. Creating a new one...');

      // Get computer details
      const identifier = await chooseIdentifier();
      const os = await chooseOS();

      // add the computer to the config
      addComputer({
        identifier,
        os,
      });

      console.info(`\nCreating new computer: ${identifier} (${os})`);

      try {
        const computer = await startComputer(os, identifier);
        printComputerTable([computer]);
      } catch (error: any) {
        console.error(
          `Failed to create computer ${identifier}: ${
            error?.message || 'Unknown error'
          }`
        );
        console.info('\nYou can create a computer later using:');
        console.info('   npx @cusedev/cli new');
      }
    }
  },
};
