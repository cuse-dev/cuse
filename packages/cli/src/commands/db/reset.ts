import { Command, Flags } from '@oclif/core';
import inquirer from 'inquirer';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import {
  getConfigPath,
  isCuseInitialized,
  loadConfig,
} from '../../utils/config.js';
import { checkServicesStatus, stopServices } from '../../utils/docker.js';
import {
  createSpinner,
  error,
  info,
  section,
  success,
  warning,
} from '../../utils/ui.js';

const execAsync = promisify(exec);

export default class DbReset extends Command {
  static description = 'Reset the database to a clean state';

  static examples = ['<%= config.bin %> db reset'];

  static flags = {
    force: Flags.boolean({
      char: 'f',
      description: 'Force reset without confirmation',
      required: false,
      default: false,
    }),
  };

  static args = {};

  async run(): Promise<void> {
    const { flags } = await this.parse(DbReset);

    const projectDir = process.cwd();

    // Check if cuse is initialized
    const initialized = await isCuseInitialized(projectDir);
    if (!initialized) {
      error(
        'cuse is not initialized in this project. Please run "cuse init" first.'
      );
      this.exit(1);
    }

    // Load configuration to get project name
    const configPath = getConfigPath(projectDir);
    const config = await loadConfig(configPath);
    const projectName = config.project.name;
    const volumeName = `${projectName}-postgres-data`;

    if (!flags.force) {
      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: `This will delete all data in the database for project '${projectName}'. Are you sure?`,
          default: false,
        },
      ]);

      if (!confirm) {
        info('Database reset canceled');
        this.exit(0);
      }
    }

    section('Resetting database');

    // Check if services are running
    const status = await checkServicesStatus(projectDir);

    const spinner = createSpinner('Resetting database...');
    spinner.start();

    try {
      // First, stop the services if they're running
      if (status.running) {
        info('Stopping services...');
        await stopServices(projectDir);
      }

      // Remove the database volume to ensure a clean state
      try {
        await execAsync(`docker volume rm ${volumeName}`);
      } catch (e) {
        // If the volume doesn't exist, that's okay - just warn
        warning(
          `Volume ${volumeName} not found, it may have been already removed.`
        );
      }

      spinner.succeed('Database has been reset');
      success('Database has been reset to a clean state');
      info('To start services with the clean database, run: cuse start');
      info(
        'The database schema will be automatically initialized on next startup'
      );
    } catch (err) {
      spinner.fail(`Failed to reset database: ${err}`);
      this.exit(1);
    }
  }
}
