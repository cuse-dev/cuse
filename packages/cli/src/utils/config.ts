import fs from 'fs-extra';
import yaml from 'js-yaml';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Get the directory name of the current module
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export interface CuseConfig {
  project: {
    name: string;
    description: string;
  };
  appImage: string;
  providers: {
    docker: {
      enabled: boolean;
      browserImage: string;
      linuxImage: string;
      network: string;
    };
  };
  resources: {
    memoryMb: number;
    cpuCount: number;
    timeoutMs: number;
  };
}

export const DEFAULT_CONFIG: CuseConfig = {
  project: {
    name: 'my-cuse-project',
    description: 'A cuse project',
  },
  appImage: 'ghcr.io/cuse-dev/cuse/app:latest',
  providers: {
    docker: {
      enabled: true,
      browserImage: 'ghcr.io/cuse-dev/cuse/browser:latest',
      linuxImage: 'ghcr.io/cuse-dev/cuse/linux:latest',
      network: 'my-cuse-project-network',
    },
  },
  resources: {
    memoryMb: 4096,
    cpuCount: 4,
    timeoutMs: 300000,
  },
};

/**
 * Load configuration from a file
 */
export async function loadConfig(configPath: string): Promise<CuseConfig> {
  try {
    const configContent = await fs.readFile(configPath, 'utf8');
    const config = yaml.load(configContent) as CuseConfig;
    return config;
  } catch (error) {
    throw new Error(`Failed to load config from ${configPath}: ${error}`);
  }
}

/**
 * Save configuration to a file
 */
export async function saveConfig(
  config: CuseConfig,
  configPath: string
): Promise<void> {
  try {
    const configContent = yaml.dump(config, { indent: 2 });
    await fs.writeFile(configPath, configContent, 'utf8');
  } catch (error) {
    throw new Error(`Failed to save config to ${configPath}: ${error}`);
  }
}

/**
 * Get the template path
 */
export function getTemplatePath(templateName: string): string {
  // Try the dist/templates directory first (for production)
  let templatePath = path.resolve(__dirname, '../templates', templateName);

  // If the template doesn't exist, try the development path
  if (!fs.existsSync(templatePath)) {
    templatePath = path.resolve(__dirname, '../../templates', templateName);
  }

  return templatePath;
}

/**
 * Load a template file and replace placeholders
 */
export async function loadTemplate(
  templatePath: string,
  replacements: Record<string, string>
): Promise<string> {
  try {
    let template = await fs.readFile(templatePath, 'utf8');

    // Replace all placeholders
    for (const [key, value] of Object.entries(replacements)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      template = template.replace(regex, value);
    }

    return template;
  } catch (error) {
    throw new Error(`Failed to load template from ${templatePath}: ${error}`);
  }
}

/**
 * Check if cuse is initialized in the current directory
 */
export async function isCuseInitialized(projectDir: string): Promise<boolean> {
  const configPath = path.join(projectDir, 'cuse.config.yml');
  return fs.existsSync(configPath);
}

/**
 * Get the cuse global directory path
 * This is where we'll store all cuse-related files
 */
export function getCuseGlobalDir(): string {
  return path.join(os.homedir(), '.cuse');
}

/**
 * Ensure the cuse global directory exists
 */
export async function ensureCuseGlobalDir(): Promise<string> {
  const cuseGlobalDir = getCuseGlobalDir();
  await fs.ensureDir(cuseGlobalDir);
  return cuseGlobalDir;
}

/**
 * Get the project-specific directory within the global cuse directory
 */
export function getProjectDir(projectName: string): string {
  return path.join(getCuseGlobalDir(), 'projects', projectName);
}

/**
 * Ensure the project-specific directory exists
 */
export async function ensureProjectDir(projectName: string): Promise<string> {
  const projectDir = getProjectDir(projectName);
  await fs.ensureDir(projectDir);
  return projectDir;
}

/**
 * Get the docker-compose file path for a project
 */
export function getDockerComposePath(projectDir: string): string {
  // First, get the project name from the config
  const configPath = getConfigPath(projectDir);

  try {
    // If the config file doesn't exist, return a default path
    if (!fs.existsSync(configPath)) {
      return path.join(getCuseGlobalDir(), 'docker-compose.yml');
    }

    // Load the config to get the project name
    const configContent = fs.readFileSync(configPath, 'utf8');
    const config = yaml.load(configContent) as CuseConfig;
    const projectName = config.project.name;

    // Return the path to the docker-compose file in the project-specific directory
    return path.join(getProjectDir(projectName), 'docker-compose.yml');
  } catch (_error) {
    // If there's an error, return a default path
    return path.join(getCuseGlobalDir(), 'docker-compose.yml');
  }
}

/**
 * Get the config file path
 */
export function getConfigPath(projectDir: string): string {
  return path.join(projectDir, 'cuse.config.yml');
}
