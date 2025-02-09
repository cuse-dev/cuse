# @repo/runtimes

A flexible abstraction layer for managing computer runtime environments across different providers.

## Overview

This package provides a unified interface for managing computer runtime environments (VMs, containers, etc.) across different infrastructure providers. It defines core abstractions and interfaces that make it easy to implement new runtime providers while maintaining a consistent API.

## Features

- Abstract runtime management interface
- Provider-agnostic configuration
- Event-driven status and metrics updates
- Extensible provider system
- Type-safe runtime operations

## Installation

```bash
pnpm add @repo/runtimes
```

## Usage

### Basic Usage

```typescript
import { Runtime, BaseRuntimeConfig } from '@repo/runtimes';

// Configure your runtime
const config: BaseRuntimeConfig = {
  id: 'my-runtime',
  name: 'My Runtime',
  memoryMb: 2048,
  cpuCount: 2,
  timeoutMs: 300000,
};

// Create runtime instance using your preferred provider
const runtime = new YourRuntimeProvider(config);

// Start the runtime
await runtime.start();

// Listen for status changes
runtime.on('status_changed', (event) => {
  console.log(
    `Status changed from ${event.data.oldStatus} to ${event.data.newStatus}`
  );
});

// Get runtime metrics
const metrics = await runtime.getMetrics();
console.log('Current CPU usage:', metrics.cpuUsagePercent);
```

### Implementing a Provider

To implement a new runtime provider, extend the `BaseRuntime` class:

```typescript
import { BaseRuntime, RuntimeCapabilities } from '@repo/runtimes';

export class MyRuntimeProvider extends BaseRuntime {
  get capabilities(): RuntimeCapabilities {
    return {
      supportsGpu: false,
      supportsCustomImages: true,
      supportsFileSystem: true,
      supportsNetworking: true,
      maxMemoryMb: 16384,
      maxCpuCount: 8,
      maxTimeoutMs: 3600000,
    };
  }

  async start(): Promise<void> {
    // Implement runtime start logic
    this.updateStatus(RuntimeStatus.RUNNING);
  }

  async stop(): Promise<void> {
    // Implement runtime stop logic
    this.updateStatus(RuntimeStatus.STOPPED);
  }

  async terminate(): Promise<void> {
    // Implement runtime cleanup logic
    this.updateStatus(RuntimeStatus.TERMINATED);
  }
}
```

## API Reference

### Runtime Interface

The core `Runtime` interface defines the following:

#### Properties

- `id`: Unique identifier for the runtime
- `name`: Human-readable name
- `status`: Current runtime status
- `config`: Runtime configuration
- `capabilities`: Provider capabilities

#### Methods

- `start()`: Start the runtime
- `stop()`: Stop the runtime
- `restart()`: Restart the runtime
- `terminate()`: Cleanup and terminate the runtime
- `getStatus()`: Get current status
- `getMetrics()`: Get runtime metrics

#### Events

- `status_changed`: Emitted when runtime status changes
- `metrics_updated`: Emitted when metrics are updated
- `error`: Emitted when an error occurs

## License

MIT
