import { Command } from '@oclif/core';
import { isCuseInitialized } from '../utils/config.js';
import { checkServicesStatus, stopServices } from '../utils/docker.js';
import { createSpinner, error, info, section, success } from '../utils/ui.js';

export default class Stop extends Command {
  static description = 'Stop cuse services';

  static examples = ['<%= config.bin %> stop'];

  static flags = {};

  static args = {};

  async run(): Promise<void> {
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

    // Check if services are running
    const status = await checkServicesStatus(projectDir);
    if (!status.running) {
      info('cuse services are not running');
      this.exit(0);
    }

    // Stop services
    section('Stopping cuse services');

    const spinner = createSpinner('Stopping services...');
    spinner.start();

    try {
      await stopServices(projectDir);
      spinner.succeed('Services stopped successfully');
      success('cuse services have been stopped');
    } catch (error) {
      spinner.fail(`Failed to stop services: ${error}`);
      this.exit(1);
    }
  }
}
