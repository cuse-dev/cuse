# @cusedev/cli

A beautiful CLI tool for initializing and managing cuse in your projects.

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/@cusedev/cli.svg)](https://npmjs.org/package/@cusedev/cli)
[![Downloads/week](https://img.shields.io/npm/dw/@cusedev/cli.svg)](https://npmjs.org/package/@cusedev/cli)
[![License](https://img.shields.io/npm/l/@cusedev/cli.svg)](https://github.com/cuse-dev/cuse/blob/main/package.json)

## Overview

cuse is a platform for creating and managing computer use agents. Computer use agents are AI-powered assistants that control a computer environment by running commands and interacting with mouse and keyboard controls.

This CLI tool helps you initialize cuse in your project, manage cuse services, and create virtual computers.

## Installation

```bash
npm install -g @cusedev/cli
# or
yarn global add @cusedev/cli
# or
pnpm add -g @cusedev/cli
```

## Usage

```bash
cuse [command]
```

## Commands

### `cuse init`

Initialize cuse in your project. This command creates a `cuse.config.yml` file and sets up the necessary Docker Compose configuration.

```bash
cuse init [--name <project-name>] [--description <project-description>] [--app-image <image>] [--browser-image <image>] [--yes]
```

Options:
- `--name, -n`: Project name
- `--description, -d`: Project description
- `--app-image`: Application image to use
- `--browser-image`: Browser image to use
- `--yes, -y`: Skip confirmation prompts

### `cuse start`

Start cuse services.

```bash
cuse start [--no-pull] [--skip-migrations]
```

Options:
- `--no-pull`: Skip pulling Docker images
- `--skip-migrations`: Skip running database migrations

### `cuse stop`

Stop cuse services.

```bash
cuse stop
```

### `cuse status`

Check the status of cuse services.

```bash
cuse status
```

### `cuse db init`

Initialize or update the database schema by applying SQL migrations.

```bash
cuse db init
```

### `cuse db reset`

Reset the database to a clean state by removing the data volume.

```bash
cuse db reset [--force]
```

Options:
- `--force, -f`: Skip confirmation prompt

### `cuse new [name]`

Create a new virtual computer.

```bash
cuse new [name] [--platform <platform>] [--template <template>] [--config <config-file>]
```

Arguments:
- `name`: Name for the new computer (optional)

Options:
- `--platform, -p`: Platform to use (linux, browser)
- `--template, -t`: Template to use
- `--config, -c`: Path to configuration file (defaults to cuse.config.yml)

## Configuration

The `cuse.config.yml` file is used to configure your cuse project. Here's an example:

```yaml
project:
  name: my-cuse-project
  description: A cuse project

# Application image to use
appImage: ghcr.io/cuse-dev/cuse/app:latest

# Provider configuration
providers:
  docker:
    enabled: true
    browserImage: ghcr.io/cuse-dev/cuse/browser:latest
    network: my-cuse-project-network
    
# Resource defaults
resources:
  memoryMb: 4096
  cpuCount: 4
  timeoutMs: 300000
```

## Docker Compose

The CLI generates a Docker Compose file based on your configuration. The Docker Compose file includes:

- A PostgreSQL database service
- The cuse application service
- Network configuration to ensure all containers are organized in the same compose group

## Development

```bash
# Clone the repository
git clone https://github.com/cuse-dev/cuse.git
cd cuse

# Install dependencies
pnpm install

# Build the CLI
pnpm run build

# Link the CLI for local development
pnpm link -g
```

## License

MIT
