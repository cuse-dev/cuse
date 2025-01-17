import type { Arguments } from 'yargs';
import type { BaseOptions, CommandModule } from './types';
import { startComputer } from '../utils/docker';
import {
  chooseOS,
  chooseIdentifier,
  validateIdentifier,
  supportedOS,
} from './utils';
import { printComputerTable } from '../utils/print';
import { configExists, addComputer } from '../utils/project';
import { execa } from 'execa';

async function checkEndpoint(
  url: string,
  message?: string,
  maxRetries = 30,
  retryDelay = 1000
): Promise<boolean> {
  if (message) {
    process.stdout.write(`${message}`);
  }
  for (let i = 0; i < maxRetries; i++) {
    try {
      const { stdout } = await execa('curl', ['-s', '-I', url]);
      if (stdout.includes('HTTP/1.1 200') || stdout.includes('HTTP/1.1 405')) {
        return true;
      }
      process.stdout.write('.');
    } catch (error) {
      console.error(`Error: ${error}`);
      process.stdout.write('.');
    }
    if (i < maxRetries - 1) {
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
    }
  }
  process.stdout.write(
    `\n✗ Service failed to respond after ${maxRetries} attempts\n`
  );
  return false;
}

interface NewOptions extends BaseOptions {
  computerName?: string;
  template?: string;
  platform?: string;
  config?: string;
}

export const newCommand: CommandModule<NewOptions> = {
  command: 'new [computer-name]',
  describe: 'Create a new cuse computer',
  builder: (yargs) => {
    return yargs
      .positional('computer-name', {
        type: 'string',
        description: 'Name for the new cuse computer',
      })
      .option('template', {
        type: 'string',
        description: "Computer template (e.g., 'ubuntu')",
      })
      .option('platform', {
        type: 'string',
        description: "Platform (e.g., 'linux')",
        choices: supportedOS,
      })
      .option('config', {
        type: 'string',
        description: 'Configuration file path',
        default: 'cuse.config.yml',
      });
  },
  async handler(argv: Arguments<NewOptions>) {
    if (!configExists()) {
      console.error('No cuse configuration found in this directory.');
      console.info("Run 'cuse init' to initialize a new configuration.");
      process.exit(1);
    }

    let identifier = argv.computerName;
    if (identifier) {
      // Validate and sanitize provided name
      if (!/^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/.test(identifier)) {
        console.warn('Invalid computer name format, sanitizing...');
        identifier = validateIdentifier(identifier);
        console.info(`Using sanitized name: ${identifier}`);
      }
    } else {
      identifier = await chooseIdentifier();
    }

    const os = await chooseOS(argv.platform);
    console.info(`Creating new computer: ${identifier} (${os})`);

    const computer = await startComputer(os, identifier);

    // Check if endpoints are accessible
    console.info('\nSetting up cuse API Service');
    const apiWorking = await checkEndpoint(
      computer.api,
      `Starting computer ${computer.identifier}...`
    );
    if (apiWorking) {
      console.info('\n✓ cuse API is ready');
    } else {
      console.warn('\n⚠️ cuse API is not responding');
    }

    console.info('\nSetting up noVNC Service');
    const vncWorking = await checkEndpoint(computer.novnc);
    if (vncWorking) {
      console.info('\n✓ noVNC is ready');
    } else {
      console.warn('\n⚠️ noVNC is not responding');
    }

    if (!apiWorking || !vncWorking) {
      console.info('\nTroubleshooting steps:');
      console.info('1. Check if the proxy is running: cuse proxy status');
      console.info(
        '2. Check container logs: docker logs',
        computer.containerId
      );
      console.info('3. Check proxy logs: docker logs cuse-proxy');
      console.info('4. Try restarting: cuse start', identifier);

      process.exit(1);
    } else {
      console.info(`\n${os[0].toUpperCase() + os.slice(1)} computer started!`);
      console.info(`Container: ${computer.containerId}`);
      console.info(`API: ${computer.api || 'No API URL available'}`);
      console.info(`noVNC: ${computer.novnc || 'No noVNC URL available'}`);
      console.info(`VNC: ${computer.api}/vnc || "No VNC URL available"`);

      // Add computer to config
      addComputer({
        identifier,
        os,
        template: argv.template,
      });

      printComputerTable([computer]);
    }
  },
};
