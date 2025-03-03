import fs from 'fs-extra';
import { exec } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import {
  ensureProjectDir,
  getConfigPath,
  getDockerComposePath,
  getTemplatePath,
  loadConfig,
} from './config.js';

const execAsync = promisify(exec);

/**
 * Check if Docker is installed and running
 */
export async function checkDocker(): Promise<boolean> {
  try {
    await execAsync('docker info');
    return true;
  } catch (_error) {
    return false;
  }
}

/**
 * Check if Docker Compose is installed
 */
export async function checkDockerCompose(): Promise<boolean> {
  try {
    await execAsync('docker compose version');
    return true;
  } catch (_error) {
    return false;
  }
}

/**
 * Start cuse services using Docker Compose
 */
export async function startServices(projectDir: string): Promise<void> {
  const dockerComposePath = getDockerComposePath(projectDir);

  if (!fs.existsSync(dockerComposePath)) {
    throw new Error(
      'Docker Compose file not found. Please run "cuse init" first.'
    );
  }

  try {
    const { stderr } = await execAsync(
      `docker compose -f ${dockerComposePath} up -d`
    );
    if (stderr) {
      console.error(stderr);
    }
  } catch (error) {
    throw new Error(`Failed to start services: ${error}`);
  }
}

/**
 * Stop cuse services using Docker Compose
 */
export async function stopServices(projectDir: string): Promise<void> {
  const dockerComposePath = getDockerComposePath(projectDir);

  if (!fs.existsSync(dockerComposePath)) {
    throw new Error(
      'Docker Compose file not found. Please run "cuse init" first.'
    );
  }

  try {
    const { stderr } = await execAsync(
      `docker compose -f ${dockerComposePath} down`
    );
    if (stderr) {
      console.error(stderr);
    }
  } catch (error) {
    throw new Error(`Failed to stop services: ${error}`);
  }
}

/**
 * Check the status of cuse services
 */
export async function checkServicesStatus(
  projectDir: string
): Promise<{ running: boolean; services: any[] }> {
  const dockerComposePath = getDockerComposePath(projectDir);

  if (!fs.existsSync(dockerComposePath)) {
    return { running: false, services: [] };
  }

  try {
    const { stdout } = await execAsync(
      `docker compose -f ${dockerComposePath} ps --format json`
    );
    const services = stdout ? JSON.parse(stdout) : [];
    return {
      running:
        services.length > 0 && services.some((s: any) => s.State === 'running'),
      services,
    };
  } catch (_error) {
    return { running: false, services: [] };
  }
}

/**
 * Generate a Docker Compose file from the configuration
 */
export async function generateDockerComposeFile(
  projectDir: string
): Promise<string> {
  const configPath = getConfigPath(projectDir);
  const config = await loadConfig(configPath);

  // Get the directory name of the current module
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  // Path to the SQL templates in the CLI package
  // During development, this will be in the templates directory
  // After build, this will be in the dist/templates directory
  let cliSqlPath = path.resolve(__dirname, '../templates/sql');

  // If the path doesn't exist, try the development path
  if (!fs.existsSync(cliSqlPath)) {
    cliSqlPath = path.resolve(__dirname, '../../templates/sql');
  }

  // Path to the Docker Compose template
  const templatePath = getTemplatePath(
    'docker-compose/docker-compose.yml.template'
  );
  const template = await fs.readFile(templatePath, 'utf8');

  // Replace placeholders
  const dockerComposeContent = template
    .replace(/{{projectName}}/g, config.project.name)
    .replace(/{{appImage}}/g, config.appImage)
    .replace(/{{browserImage}}/g, config.providers.docker.browserImage)
    .replace(/{{linuxImage}}/g, config.providers.docker.linuxImage)
    .replace(/{{cliSqlPath}}/g, cliSqlPath);

  // Ensure the project directory exists
  const projectSpecificDir = await ensureProjectDir(config.project.name);

  // Write the Docker Compose file
  const dockerComposePath = getDockerComposePath(projectDir);
  await fs.writeFile(dockerComposePath, dockerComposeContent, 'utf8');

  return dockerComposePath;
}

/**
 * Pull Docker images
 */
export async function pullImages(images: string[]): Promise<void> {
  // Skip any images that start with "local" or "cuse-local" as they're likely built locally
  const remotesToPull = images.filter(
    (image) => !image.startsWith('local') && !image.startsWith('cuse-local')
  );

  for (const image of remotesToPull) {
    try {
      await execAsync(`docker pull ${image}`);
    } catch (error) {
      throw new Error(`Failed to pull image ${image}: ${error}`);
    }
  }
}

/**
 * Check if database connection is available
 */
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await execAsync(
      'docker exec -i $(docker ps -q -f "label=com.cuse.service=database") pg_isready -U postgres'
    );
    return true;
  } catch (_error) {
    return false;
  }
}
