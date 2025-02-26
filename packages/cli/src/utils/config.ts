import fs from 'fs-extra';
import yaml from 'js-yaml';
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
  return path.resolve(__dirname, '../../templates', templateName);
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
 * Get the cuse directory path
 */
export function getCuseDir(projectDir: string): string {
  return path.join(projectDir, '.cuse');
}

/**
 * Ensure the cuse directory exists
 */
export async function ensureCuseDir(projectDir: string): Promise<string> {
  const cuseDir = getCuseDir(projectDir);
  await fs.ensureDir(cuseDir);
  return cuseDir;
}

/**
 * Get the docker-compose file path
 */
export function getDockerComposePath(projectDir: string): string {
  return path.join(getCuseDir(projectDir), 'docker-compose.yml');
}

/**
 * Get the config file path
 */
export function getConfigPath(projectDir: string): string {
  return path.join(projectDir, 'cuse.config.yml');
}
