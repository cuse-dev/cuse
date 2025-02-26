import { Command } from '@oclif/core';
import { executeMigrations } from '../../utils/migrations.js';
import { createSpinner, section, success } from '../../utils/ui.js';

export default class DbInit extends Command {
  static description = 'Initialize or update the database schema';

  static examples = ['<%= config.bin %> db init'];

  static flags = {};

  static args = {};

  async run(): Promise<void> {
    section('Initializing database schema');

    // Execute the migrations
    const migrationSpinner = createSpinner('Executing SQL migrations...');
    migrationSpinner.start();

    try {
      await executeMigrations();
      migrationSpinner.succeed('Database schema updated successfully');
      success('Your database schema is now up to date');
    } catch (err) {
      migrationSpinner.fail(`Failed to execute SQL migrations: ${err}`);
      this.exit(1);
    }
  }
}
