import { execa } from 'execa';
import path from 'path';
import { getProjectName } from './project';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { PROXY_PORT } from '../config';

/**
 * Returns the absolute path to the "templates" folder.
 * Works in both development (TypeScript source) and production (transpiled).
 */
export function getTemplatesDir(): string {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const devPath = path.resolve(__dirname, '../templates');
  const distPath = path.resolve(__dirname, 'templates');

  if (fs.existsSync(distPath)) {
    return distPath;
  }
  if (fs.existsSync(devPath)) {
    return devPath;
  }

  throw new Error(`Unable to locate "templates" directory.
  Tried: 
    ${distPath} 
    ${devPath}`);
}

export async function setupProxy(): Promise<void> {
  const projectName = getProjectName();
  const templateDir = getTemplatesDir();
  const dockerComposePath = path.join(templateDir, 'docker-compose.yml');
  const nginxConfPath = path.join(templateDir, 'nginx.conf');

  const networkName = `cuse-${projectName}-network`;

  // Ensure docker network exists
  try {
    await execa('docker', ['network', 'inspect', networkName]);
    console.log(`Network ${networkName} already exists.`);
  } catch {
    console.info(`Creating docker network ${networkName}...`);
    try {
      await execa('docker', ['network', 'create', networkName]);
      // Verify network was created
      await execa('docker', ['network', 'inspect', networkName]);
      console.log(`Network ${networkName} created successfully.`);
    } catch (error: any) {
      console.error(`Failed to create network ${networkName}:`, error.message);
      throw error;
    }
  }

  // Start or restart the proxy
  console.log('Starting proxy server...');
  const port = PROXY_PORT;
  const env = {
    ...process.env,
    PROXY_PORT: port.toString(),
    COMPOSE_PROJECT_NAME: `cuse-${projectName}`,
    NGINX_CONF_PATH: nginxConfPath,
  };

  try {
    await execa(
      'docker',
      ['compose', '-f', dockerComposePath, '-p', `cuse-${projectName}`, 'down'],
      { env }
    );

    await execa(
      'docker',
      [
        'compose',
        '-f',
        dockerComposePath,
        '-p',
        `cuse-${projectName}`,
        'up',
        '-d',
      ],
      { env }
    );
    console.log('Proxy server started.');
  } catch (error: any) {
    // Check both the error message and stderr for the port binding error
    const errorText = [error?.message, error?.stderr].join(' ');
    if (errorText.includes('port is already allocated')) {
      console.error(
        `Port ${PROXY_PORT} is already in use. This usually means another cuse project is running.`
      );
      console.error(
        `Please stop other cuse projects first using 'cuse stop' in their respective directories.`
      );
      process.exit(1);
    }
    throw error;
  }
}

export async function stopProxy(): Promise<void> {
  const projectName = getProjectName();
  const dockerComposePath = path.join(getTemplatesDir(), 'docker-compose.yml');
  try {
    await execa('docker', [
      'compose',
      '-f',
      dockerComposePath,
      '-p',
      `cuse-${projectName}`,
      'down',
    ]);
  } catch (error) {
    console.warn('Failed to stop proxy server. It might already be stopped.');
  }
}

export async function cleanupProxy(): Promise<void> {
  const projectName = getProjectName();

  // Remove proxy container
  try {
    await execa('docker', ['rm', '-f', `cuse-${projectName}-proxy`]);
  } catch (error) {
    console.warn(
      'Failed to remove proxy container. It might already be removed.'
    );
  }

  // Remove network
  try {
    await execa('docker', ['network', 'rm', `cuse-${projectName}-network`]);
  } catch (error) {
    console.warn(
      'Failed to remove Docker network. It might already be removed.'
    );
  }
}
