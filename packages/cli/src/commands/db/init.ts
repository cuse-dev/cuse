import { Command } from '@oclif/core';
import { checkDatabaseSchema } from '../../utils/migrations.js';
import { createSpinner, info, section, success, warn } from '../../utils/ui.js';

export default class DbInit extends Command {
  static description = 'Check the database schema initialization status';

  static examples = ['<%= config.bin %> db init'];

  static flags = {};

  static args = {};

  async run(): Promise<void> {
    section('Checking database schema');

    // Check if the database schema is initialized
    const schemaSpinner = createSpinner('Checking database schema...');
    schemaSpinner.start();

    try {
      const isInitialized = await checkDatabaseSchema();

      if (isInitialized) {
        schemaSpinner.succeed('Database schema is properly initialized');
        success('Your database is ready to use');
      } else {
        schemaSpinner.warn('Database schema is not initialized');
        warn(
          'The database container may need to be restarted to apply the initialization script'
        );
        info(
          'Try running "cuse stop" and then "cuse start" to restart the services'
        );
      }
    } catch (err) {
      schemaSpinner.fail(`Failed to check database schema: ${err}`);
      this.exit(1);
    }
  }
}
