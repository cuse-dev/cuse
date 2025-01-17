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

    addComputer({
      identifier,
      os,
      template: argv.template,
    });

    printComputerTable([computer]);
  },
};
