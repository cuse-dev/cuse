import fs from 'fs-extra';
import { exec } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Execute migrations directly against a PostgreSQL database
 */
export async function executeMigrations(
  connectionString = 'postgresql://postgres:postgres@localhost:5432/postgres'
): Promise<void> {
  // Path to the SQL migrations in the CLI package - corrected path for npm installation
  const sqlPath = path.resolve(__dirname, '../sql');

  // Check if SQL directory exists in the CLI package
  if (!fs.existsSync(sqlPath)) {
    throw new Error(
      'SQL directory not found in the CLI package. This is likely a packaging issue with the CLI.'
    );
  }

  // Get all SQL files and sort them alphanumerically to ensure order
  let sqlFiles = fs
    .readdirSync(sqlPath)
    .filter((file) => file.endsWith('.sql'))
    .sort();

  // If no migration files found but init.sql exists, use that
  if (sqlFiles.length === 0) {
    const initSqlPath = path.join(sqlPath, 'init.sql');
    if (fs.existsSync(initSqlPath)) {
      console.log('No migration files found, using init.sql as fallback');
      sqlFiles = ['init.sql'];
    } else {
      throw new Error(
        'No SQL migration files found in the CLI package. The build process may have failed.'
      );
    }
  }

  console.log(`Found ${sqlFiles.length} SQL migration files to execute.`);

  try {
    // Try to find the database container
    try {
      // Get the container ID for the database service
      const { stdout: containerId } = await execAsync(
        'docker ps -q -f "label=com.cuse.service=database"'
      );

      if (!containerId.trim()) {
        throw new Error(
          'Database container not found. Make sure cuse services are running with "cuse start".'
        );
      }

      console.log(`Found database container: ${containerId.trim()}`);

      // Execute each SQL file against the database
      for (const sqlFile of sqlFiles) {
        const filePath = path.join(sqlPath, sqlFile);
        console.log(`Executing SQL file: ${sqlFile}`);

        // Read the SQL content and pipe it directly to PostgreSQL
        // This avoids creating temporary files in the container
        const sqlContent = fs.readFileSync(filePath, 'utf8');

        // Use a more reliable method than echo to pipe the SQL content
        await execAsync(
          `cat "${filePath}" | docker exec -i ${containerId.trim()} psql -U postgres -d postgres`
        );
      }

      console.log(
        'All SQL migrations executed successfully via Docker container.'
      );
    } catch (dockerError) {
      // Fallback to local psql if Docker container execution failed
      console.log(
        `Docker exec failed: ${dockerError}. Trying direct psql connection...`
      );

      const matches = connectionString.match(
        /postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/
      );
      if (!matches) {
        throw new Error(
          `Invalid PostgreSQL connection string: ${connectionString}`
        );
      }

      const [, user, password, host, port, database] = matches;

      // Check if psql is installed
      try {
        await execAsync('which psql');
      } catch (_psqlError) {
        throw new Error(
          'psql command not found. Please install PostgreSQL client tools.'
        );
      }

      // Execute each SQL file against the database using local psql
      for (const sqlFile of sqlFiles) {
        const filePath = path.join(sqlPath, sqlFile);
        console.log(`Executing SQL file via direct connection: ${sqlFile}`);

        // Use PSQL with a file input instead of echo to avoid command injection or escaping issues
        await execAsync(
          `PGPASSWORD=${password} psql -h ${host} -p ${port} -U ${user} -d ${database} -f "${filePath}"`
        );
      }

      console.log(
        'All SQL migrations executed successfully via direct connection.'
      );
    }
  } catch (error) {
    throw new Error(`Failed to execute SQL migrations: ${error}`);
  }
}
