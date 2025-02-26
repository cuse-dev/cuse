# cuse

**Platform for creating and managing computer use agents.**

<div>
  <img src="https://img.shields.io/github/license/cusedev/cuse" alt="" />
</div>

cuse is a platform for creating and managing computer use agents. Computer use agents are AI powered assistants that control a computer environment by running commands and interacting with mouse and keyboard controls. cuse is targeted at AI developers who want to build computer use agents or integrate computer use capabilities into their AI applications.

## CLI

cuse comes with a powerful CLI tool for managing your projects. The CLI enables you to:

- Initialize a new cuse project
- Start and stop the cuse stack
- Monitor the status of your containers
- Use custom Docker images for local development

All containers, including those created by the Docker provider, are organized in the same compose group in the Docker UI for easy management.

### Installation

```bash
# Install globally
npm install -g @cusedev/cli

# Or use the installation script
curl -fsSL https://raw.githubusercontent.com/cusedev/cuse/main/packages/cli/install.sh | bash
```

### Usage

```bash
# Initialize a new project
cuse init

# Start the stack
cuse start

# Check status
cuse status

# Stop the stack
cuse stop
```

### Local Development

For local development, you can specify a custom app image in your `cuse.config.yml`:

```yaml
# Use a custom app image for local development
appImage: your-local-app-image:latest
```

We provide a helper script to build a local image:

```bash
# From the project root
./packages/cli/scripts/build-local-image.sh
```

For more information, see the [CLI documentation](packages/cli/README.md).

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT
