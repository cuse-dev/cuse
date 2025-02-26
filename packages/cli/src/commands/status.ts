import { Command } from '@oclif/core';
import {
  getConfigPath,
  isCuseInitialized,
  loadConfig,
} from '../utils/config.js';
import { checkServicesStatus } from '../utils/docker.js';
import { createTable, error, info, section, success } from '../utils/ui.js';

export default class Status extends Command {
  static description = 'Check cuse services status';

  static examples = ['<%= config.bin %> status'];

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

    // Load configuration
    const configPath = getConfigPath(projectDir);
    const config = await loadConfig(configPath);

    // Check services status
    section('cuse services status');

    info(`Project: ${config.project.name}`);
    info(`Description: ${config.project.description}`);
    info(`App Image: ${config.appImage}`);
    info(`Browser Image: ${config.providers.docker.browserImage}`);

    const status = await checkServicesStatus(projectDir);

    if (status.running) {
      success('\nServices are running');

      // Display services table
      const table = createTable({
        head: ['Service', 'Status', 'Ports', 'Container ID'],
      });

      status.services.forEach((service) => {
        table.push([
          service.Service,
          service.State,
          service.Ports || 'N/A',
          service.ID.substring(0, 12),
        ]);
      });

      this.log(table.toString());
    } else {
      info('\nServices are not running');
      info('To start services, run: cuse start');
    }
  }
}
