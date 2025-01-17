import fs from 'fs';
import path from 'path';
import yaml from 'yaml';

export interface ComputerConfig {
  identifier: string;
  os: string;
  template?: string | undefined;
}

export interface cuseConfig {
  version: string;
  project: {
    name: string;
    description?: string;
  };
  computers: ComputerConfig[];
}

const DEFAULT_CONFIG: cuseConfig = {
  version: '1.0.0',
  project: {
    name: path.basename(process.cwd()),
  },
  computers: [],
};

export function getConfigPath(): string {
  return path.join(process.cwd(), 'cuse.config.yml');
}

export function configExists(): boolean {
  return fs.existsSync(getConfigPath());
}

export function readConfig(): cuseConfig {
  const configPath = getConfigPath();
  if (!configExists()) {
    return DEFAULT_CONFIG;
  }

  const configFile = fs.readFileSync(configPath, 'utf8');
  return yaml.parse(configFile);
}

export function writeConfig(config: cuseConfig): void {
  const configPath = getConfigPath();
  fs.writeFileSync(configPath, yaml.stringify(config));
}

export function addComputer(computer: ComputerConfig): void {
  const config = readConfig();
  const existingIndex = config.computers.findIndex(
    (c) => c.identifier === computer.identifier
  );

  if (existingIndex >= 0) {
    config.computers[existingIndex] = computer;
  } else {
    config.computers.push(computer);
  }

  writeConfig(config);
}

export function removeComputer(identifier: string): void {
  const config = readConfig();
  config.computers = config.computers.filter(
    (c) => c.identifier !== identifier
  );
  writeConfig(config);
}

export function getComputer(identifier: string): ComputerConfig | undefined {
  const config = readConfig();
  return config.computers.find((c) => c.identifier === identifier);
}

export function getAllComputers(): ComputerConfig[] {
  const config = readConfig();
  return config.computers;
}

export function getProjectName(): string {
  const config = readConfig();
  return config.project.name;
}
