import { Command, Flags } from '@oclif/core';
import { isCuseInitialized } from '../utils/config.js';
import {
  checkDatabaseConnection,
  checkServicesStatus,
  startServices,
} from '../utils/docker.js';
import { executeMigrations } from '../utils/migrations.js';
import {
  createSpinner,
  error,
  info,
  section,
  success,
  url,
  warn,
} from '../utils/ui.js';

export default class Start extends Command {
  static description = 'Start cuse services';

  static examples = ['<%= config.bin %> start'];

  static flags = {
    'no-pull': Flags.boolean({
      description: 'Skip pulling Docker images',
      required: false,
      default: false,
    }),
    'skip-migrations': Flags.boolean({
      description: 'Skip running database migrations',
      required: false,
      default: false,
    }),
  };

  static args = {};

  async run(): Promise<void> {
    const { flags } = await this.parse(Start);

    // Get the current working directory
    const projectDir = process.cwd();

    // Check if cuse is initialized
    const initialized = await isCuseInitialized(projectDir);
    if (!initialized) {
      error(
        'cuse is not initialized in this project. Please run "cuse init" first.'
      );
      this.exit(1);
    }

    // Check if services are already running
    const status = await checkServicesStatus(projectDir);
    if (status.running) {
      info('cuse services are already running');

      // Check if we need to run migrations
      if (!flags['skip-migrations']) {
        await this.checkAndRunMigrations(projectDir);
      }

      this.displayServiceInfo();
      this.exit(0);
    }

    // Start services
    section('Starting cuse services');

    const spinner = createSpinner('Starting services...');
    spinner.start();

    try {
      await startServices(projectDir);
      spinner.succeed('Services started successfully');

      // Check if database needs migration after services are started
      if (!flags['skip-migrations']) {
        await this.checkAndRunMigrations(projectDir);
      }

      // Display service information
      this.displayServiceInfo();
    } catch (error) {
      spinner.fail(`Failed to start services: ${error}`);
      this.exit(1);
    }
  }

  private async checkAndRunMigrations(projectDir: string): Promise<void> {
    // Check if we can connect to the database
    const dbConnected = await checkDatabaseConnection();

    if (!dbConnected) {
      warn('Could not connect to the database. Skipping migrations.');
      return;
    }

    const migrationSpinner = createSpinner('Checking database schema...');
    migrationSpinner.start();

    try {
      await executeMigrations();
      migrationSpinner.succeed('Database schema is up to date');
    } catch (error) {
      migrationSpinner.fail(`Failed to run migrations: ${error}`);
      warn(
        'Your application may not function correctly without the proper database schema.'
      );
      warn('You can manually run migrations with: cuse db init');
    }
  }

  private displayServiceInfo(): void {
    success('cuse services are now running');
    info('You can access the following services:');
    url('Application', 'http://localhost:3000');
    url('Database', 'postgresql://postgres:postgres@localhost:5432/postgres');
    info('\nTo stop the services, run: cuse stop');
  }
}
