import { Command, Flags } from '@oclif/core';
import fs from 'fs-extra';
import inquirer from 'inquirer';
import { DEFAULT_CONFIG, getConfigPath, saveConfig } from '../utils/config.js';
import {
  checkDocker,
  checkDockerCompose,
  generateDockerComposeFile,
  pullImages,
} from '../utils/docker.js';
import { createTaskList, error, info, section, success } from '../utils/ui.js';

export default class Init extends Command {
  static description = 'Initialize cuse in your project';

  static examples = [
    '<%= config.bin %> init',
    '<%= config.bin %> init --name my-project',
    '<%= config.bin %> init --app-image my-custom-image:latest',
  ];

  static flags = {
    name: Flags.string({
      char: 'n',
      description: 'Project name',
      required: false,
    }),
    description: Flags.string({
      char: 'd',
      description: 'Project description',
      required: false,
    }),
    'app-image': Flags.string({
      description: 'Application image to use',
      required: false,
    }),
    'browser-image': Flags.string({
      description: 'Browser image to use',
      required: false,
    }),
    yes: Flags.boolean({
      char: 'y',
      description: 'Skip confirmation prompts',
      required: false,
      default: false,
    }),
  };

  static args = {};

  async run(): Promise<void> {
    const { flags } = await this.parse(Init);

    // Get the current working directory
    const projectDir = process.cwd();

    // Check if cuse.config.yml already exists
    const configPath = getConfigPath(projectDir);
    if (fs.existsSync(configPath) && !flags.yes) {
      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message:
            'cuse is already initialized in this project. Do you want to reinitialize it?',
          default: false,
        },
      ]);

      if (!confirm) {
        this.exit(0);
      }
    }

    // Check if Docker is installed and running
    const dockerInstalled = await checkDocker();
    if (!dockerInstalled) {
      error(
        'Docker is not installed or not running. Please install Docker and try again.'
      );
      this.exit(1);
    }

    // Check if Docker Compose is installed
    const dockerComposeInstalled = await checkDockerCompose();
    if (!dockerComposeInstalled) {
      error(
        'Docker Compose is not installed. Please install Docker Compose and try again.'
      );
      this.exit(1);
    }

    // Get project configuration
    const config = { ...DEFAULT_CONFIG };

    // Update config with flags
    if (flags.name) {
      config.project.name = flags.name;
    }

    if (flags.description) {
      config.project.description = flags.description;
    }

    if (flags['app-image']) {
      config.appImage = flags['app-image'];
    }

    if (flags['browser-image']) {
      config.providers.docker.browserImage = flags['browser-image'];
    }

    // If not using --yes flag, prompt for missing values
    if (!flags.yes) {
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'name',
          message: 'Project name:',
          default: config.project.name,
          when: !flags.name,
        },
        {
          type: 'input',
          name: 'description',
          message: 'Project description:',
          default: config.project.description,
          when: !flags.description,
        },
        {
          type: 'input',
          name: 'appImage',
          message: 'Application image:',
          default: config.appImage,
          when: !flags['app-image'],
        },
        {
          type: 'input',
          name: 'browserImage',
          message: 'Browser image:',
          default: config.providers.docker.browserImage,
          when: !flags['browser-image'],
        },
      ]);

      // Update config with answers
      if (answers.name) {
        config.project.name = answers.name;
      }

      if (answers.description) {
        config.project.description = answers.description;
      }

      if (answers.appImage) {
        config.appImage = answers.appImage;
      }

      if (answers.browserImage) {
        config.providers.docker.browserImage = answers.browserImage;
      }
    }

    // Update network name based on project name
    config.providers.docker.network = `${config.project.name}-network`;

    // Initialize cuse
    section('Initializing cuse');

    const tasks = createTaskList([
      {
        title: 'Creating configuration file',
        task: async () => {
          await saveConfig(config, configPath);
        },
      },
      {
        title: 'Generating Docker Compose file',
        task: async () => {
          await generateDockerComposeFile(projectDir);
        },
      },
      {
        title: 'Pulling Docker images',
        task: async () => {
          await pullImages([
            config.appImage,
            config.providers.docker.browserImage,
          ]);
        },
      },
    ]);

    try {
      await tasks.run();
      success(`cuse initialized successfully in ${projectDir}`);
      info('To start cuse services, run: cuse start');
    } catch (error) {
      this.error(`Failed to initialize cuse: ${error}`);
    }
  }
}
