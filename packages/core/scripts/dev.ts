import { spawn } from 'node:child_process';
import * as core from '../index';

async function runCommand(command: string) {
  return new Promise((resolve, reject) => {
    const [cmd, ...args] = command.split(' ');
    const process = spawn(cmd, args, { stdio: 'inherit', shell: true });

    process.on('close', (code) => {
      if (code === 0) {
        resolve(undefined);
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });
  });
}

async function main() {
  if (!core) {
    throw new Error('core is not defined');
  }

  try {
    await runCommand('bun run build');
    await runCommand('bun run check-types');
  } catch (_error) {
    process.exit(1);
  }
}

main();
