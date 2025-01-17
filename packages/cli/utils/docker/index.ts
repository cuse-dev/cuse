import { execa } from 'execa';
import { imagesByOS, PROXY_PORT } from '../../config.js';
import { getProjectName } from '../project.js';

export interface ComputerInfo {
  identifier: string;
  os: string;
  containerId: string;
  hostname: string;
  api: string;
  novnc: string;
}

async function containerExists(name: string): Promise<boolean> {
  try {
    const { stdout } = await execa('docker', [
      'ps',
      '-a',
      '--filter',
      `name=${name}`,
      '--format',
      '{{.Names}}',
    ]);
    return stdout.trim().split('\n').includes(name);
  } catch {
    return false;
  }
}

async function containerIsRunning(name: string): Promise<boolean> {
  try {
    const { stdout } = await execa('docker', [
      'ps',
      '--filter',
      `name=${name}`,
      '--filter',
      'status=running',
      '--format',
      '{{.Names}}',
    ]);
    return stdout.trim().split('\n').includes(name);
  } catch {
    return false;
  }
}

async function getContainerInfo(
  identifier: string
): Promise<ComputerInfo | null> {
  try {
    const { stdout } = await execa('docker', [
      'inspect',
      '--format',
      '{{.Id}}\t{{.Config.Image}}\t{{.Name}}',
      identifier,
    ]);

    const parts = stdout.trim().split('\t');
    if (parts.length !== 3) {
      return null;
    }

    const [id, image, name] = parts as [string, string, string];
    const os =
      Object.entries(imagesByOS).find(([, img]) => img === image)?.[0] ||
      'unknown';
    const cleanName = name.replace('/', '');

    return {
      identifier: cleanName,
      os,
      containerId: id.slice(0, 12),
      hostname: cleanName,
      api: `http://localhost:${PROXY_PORT}/${cleanName}`,
      novnc: `http://localhost:${PROXY_PORT}/${cleanName}/novnc`,
    };
  } catch {
    return null;
  }
}

export async function startComputer(
  os: string = 'linux',
  identifier: string
): Promise<ComputerInfo> {
  const image = imagesByOS[os];
  if (!image) {
    throw new Error(`OS "${os}" is not supported.`);
  }

  const exists = await containerExists(identifier);
  const projectName = getProjectName();

  try {
    if (exists) {
      const running = await containerIsRunning(identifier);
      if (!running) {
        await execa('docker', ['start', identifier]);
      }
    } else {
      await execa('docker', [
        'run',
        '-d',
        '--name',
        identifier,
        '--hostname',
        identifier,
        '--network',
        `cuse-${projectName}-network`,
        '--label',
        `com.docker.compose.project=cuse-${projectName}`,
        '--label',
        `com.docker.compose.service=${identifier}`,
        image,
      ]);
    }
  } catch (error: any) {
    const errorMessage = error?.message || '';
    if (errorMessage.includes('port is already allocated')) {
      throw new Error(
        'A cuse project is already running. Please stop it before starting a new one.'
      );
    }
    throw error;
  }

  const info = await getContainerInfo(identifier);
  if (!info) {
    throw new Error(`Failed to get container info for "${identifier}"`);
  }
  return info;
}

export const startComputerWithIdentifier = async (
  identifier: string
): Promise<ComputerInfo> => {
  const running = await containerIsRunning(identifier);
  if (!running) {
    await execa('docker', ['start', identifier]);
  }
  const info = await getContainerInfo(identifier);
  if (!info) {
    throw new Error(`Failed to get container info for "${identifier}"`);
  }
  return info;
};

export async function getAllRunningComputers(): Promise<ComputerInfo[]> {
  const { stdout } = await execa('docker', [
    'ps',
    '--filter',
    `ancestor=${Object.values(imagesByOS).join(',')}`,
    '--format',
    '{{.Names}}',
  ]);

  const names = stdout.trim().split('\n').filter(Boolean);
  const infos = await Promise.all(names.map((name) => getContainerInfo(name)));
  return infos.filter((info): info is ComputerInfo => info !== null);
}

export async function getAllComputers(): Promise<ComputerInfo[]> {
  const { stdout } = await execa('docker', [
    'ps',
    '-a',
    '--filter',
    `ancestor=${Object.values(imagesByOS).join(',')}`,
    '--format',
    '{{.Names}}',
  ]);

  const names = stdout.trim().split('\n').filter(Boolean);
  const infos = await Promise.all(names.map((name) => getContainerInfo(name)));
  return infos.filter((info): info is ComputerInfo => info !== null);
}

export async function cleanAllComputers(): Promise<void> {
  const { stdout } = await execa('docker', [
    'ps',
    '-a',
    '--filter',
    `ancestor=${Object.values(imagesByOS).join(',')}`,
    '--format',
    '{{.Names}}',
  ]);

  const names = stdout.trim().split('\n').filter(Boolean);
  await Promise.all(
    names.map(async (name) => {
      try {
        await execa('docker', ['rm', '-f', name]);
      } catch (err) {
        console.warn(`Failed to remove container ${name}: ${err}`);
      }
    })
  );
}

export async function removeComputer(identifier: string): Promise<void> {
  try {
    await execa('docker', ['rm', '-f', identifier]);
  } catch (error: any) {
    console.warn(
      `Failed to remove container ${identifier}: ${
        error?.message || 'Unknown error'
      }`
    );
  }
}
