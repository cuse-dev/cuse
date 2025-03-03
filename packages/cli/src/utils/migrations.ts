import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

/**
 * Check if the database schema is properly initialized
 * This is a simplified version that just checks if the ComputerInstance table exists
 */
export async function checkDatabaseSchema(
  connectionString = 'postgresql://postgres:postgres@localhost:5432/postgres'
): Promise<boolean> {
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

      // Check if the ComputerInstance table exists
      const { stdout } = await execAsync(
        `docker exec -i ${containerId.trim()} psql -U postgres -d postgres -t -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'ComputerInstance')"`
      );

      return stdout.trim() === 't';
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

      // Check if the ComputerInstance table exists using local psql
      const { stdout } = await execAsync(
        `PGPASSWORD=${password} psql -h ${host} -p ${port} -U ${user} -d ${database} -t -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'ComputerInstance')"`
      );

      return stdout.trim() === 't';
    }
  } catch (error) {
    throw new Error(`Failed to check database schema: ${error}`);
  }
}
