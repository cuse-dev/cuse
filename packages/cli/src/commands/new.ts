import { Args, Command, Flags } from '@oclif/core';
import inquirer from 'inquirer';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import {
  getConfigPath,
  isCuseInitialized,
  loadConfig,
} from '../utils/config.js';
import { checkServicesStatus } from '../utils/docker.js';
import {
  createSpinner,
  error,
  info,
  section,
  success,
  url,
} from '../utils/ui.js';

const execAsync = promisify(exec);

export default class New extends Command {
  static description = 'Create a new virtual computer';

  static examples = [
    '<%= config.bin %> new',
    '<%= config.bin %> new my-computer',
    '<%= config.bin %> new my-computer --platform linux',
  ];

  static flags = {
    platform: Flags.string({
      char: 'p',
      description: 'Platform to use (linux, browser)',
      required: false,
      options: ['linux', 'browser'],
    }),
    template: Flags.string({
      char: 't',
      description: 'Template to use',
      required: false,
    }),
    config: Flags.string({
      char: 'c',
      description: 'Path to configuration file',
      required: false,
      default: 'cuse.config.yml',
    }),
  };

  static args = {
    name: Args.string({
      description: 'Name for the new computer',
      required: false,
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(New);

    // Get the current working directory
    const projectDir = process.cwd();

    // Check if cuse is initialized
    const initialized = await isCuseInitialized(projectDir);
    if (!initialized) {
      error(
        'cuse is not initialized in this project. Please run "cuse init" first.'
      );
      this.exit(1);
    }

    // Check if services are running
    const status = await checkServicesStatus(projectDir);
    if (!status.running) {
      error('cuse services are not running. Please run "cuse start" first.');
      this.exit(1);
    }

    // Load configuration
    const configPath = getConfigPath(projectDir);
    const config = await loadConfig(configPath);

    // Get computer name
    let computerName = args.name;
    if (!computerName) {
      const { name } = await inquirer.prompt([
        {
          type: 'input',
          name: 'name',
          message: 'Enter a name for the new computer:',
          default: `${config.project.name}-computer`,
        },
      ]);
      computerName = name;
    }

    // Get platform
    let platform = flags.platform;
    if (!platform) {
      const { selectedPlatform } = await inquirer.prompt([
        {
          type: 'list',
          name: 'selectedPlatform',
          message: 'Select a platform:',
          choices: ['linux', 'browser'],
          default: 'linux',
        },
      ]);
      platform = selectedPlatform;
    }

    // Create computer
    section(`Creating new ${platform} computer: ${computerName}`);

    const spinner = createSpinner('Creating computer...');
    spinner.start();

    try {
      // Make API call to create computer
      const apiUrl = 'http://localhost:3000/api/computers';
      const { stdout } = await execAsync(
        `curl -X POST ${apiUrl} -H "Content-Type: application/json" -d '{"name":"${computerName}","platform":"${platform!.toUpperCase()}"}'`
      );

      const response = JSON.parse(stdout);

      spinner.succeed('Computer created successfully');

      // Display computer information
      success(`Computer ${computerName} created successfully`);
      info('You can access the computer at:');
      url(
        'API endpoint',
        `http://localhost:3000/api/computers/${computerName}`
      );

      if (platform === 'linux') {
        url(
          'noVNC interface',
          `http://localhost:3000/computers/${computerName}/novnc/`
        );
        url(
          'VNC endpoint',
          `http://localhost:3000/computers/${computerName}/vnc/`
        );
      } else if (platform === 'browser') {
        url(
          'Browser interface',
          `http://localhost:3000/computers/${computerName}/browser/`
        );
      }
    } catch (error) {
      spinner.fail(`Failed to create computer: ${error}`);
      this.exit(1);
    }
  }
}
