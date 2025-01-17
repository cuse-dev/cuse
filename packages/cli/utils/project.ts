import fs from 'fs';
import path from 'path';
import yaml from 'yaml';

export interface ComputerConfig {
  identifier: string;
  os: string;
  template?: string | undefined;
}

export interface CuseConfig {
  version: string;
  project: {
    name: string;
    description?: string;
  };
  computers: ComputerConfig[];
}

const DEFAULT_CONFIG: CuseConfig = {
  version: '1.0.0',
  project: {
    name: path.basename(process.cwd()),
  },
  computers: [],
};

export function getConfigPath(): string {
  return path.join(process.cwd(), 'cuse.config.yml');
}

export function configExists(configPath?: string): boolean {
  return fs.existsSync(configPath || getConfigPath());
}

export function readConfig(configPath?: string): CuseConfig {
  const cp = configPath || getConfigPath();
  if (!configExists(cp)) {
    return DEFAULT_CONFIG;
  }

  const configFile = fs.readFileSync(cp, 'utf8');
  return yaml.parse(configFile);
}

export function writeConfig(config: CuseConfig, configPath?: string): void {
  const cp = configPath || getConfigPath();
  fs.writeFileSync(cp, yaml.stringify(config));
}

export function addComputer(
  computer: ComputerConfig,
  configPath?: string
): void {
  const config = readConfig(configPath);
  const existingIndex = config.computers.findIndex(
    (c) => c.identifier === computer.identifier
  );

  if (existingIndex >= 0) {
    config.computers[existingIndex] = computer;
  } else {
    config.computers.push(computer);
  }

  writeConfig(config, configPath);
}

export function removeComputer(identifier: string, configPath?: string): void {
  const config = readConfig(configPath);
  config.computers = config.computers.filter(
    (c) => c.identifier !== identifier
  );
  writeConfig(config, configPath);
}

export function getComputer(
  identifier: string,
  configPath?: string
): ComputerConfig | undefined {
  const config = readConfig(configPath);
  return config.computers.find((c) => c.identifier === identifier);
}

export function getAllComputers(configPath?: string): ComputerConfig[] {
  const config = readConfig(configPath);
  return config.computers;
}

export function getProjectName(configPath?: string): string {
  const config = readConfig(configPath);
  return config.project.name;
}
