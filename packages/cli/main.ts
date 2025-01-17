import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import {
  listCommand,
  rmCommand,
  statusCommand,
  destroyCommand,
  newCommand,
  startCommand,
  initCommand,
  stopCommand,
  restartCommand,
} from './commands';

yargs(hideBin(process.argv))
  .scriptName('cuse')
  .command(listCommand)
  .command(rmCommand)
  .command(statusCommand)
  .command(destroyCommand)
  .command(newCommand)
  .command(startCommand)
  .command(initCommand)
  .command(stopCommand)
  .command(restartCommand)
  .version()
  .help()
  .epilogue(
    'Need help or have questions? Schedule a call with us at: https://cal.com/matteovhaxt/30min'
  )
  .alias('help', 'h')
  .alias('version', 'v')
  .strict()
  .demandCommand(1, 'Please specify a command')
  .parse();
