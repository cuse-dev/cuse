#!/usr/bin/env node

import { program } from 'commander';

program
  .command('update')
  .description('Update the project from one version to another')
  .option('--from <version>', 'Version to update from e.g. 1.0.0')
  .option('--to <version>', 'Version to update to e.g. 2.0.0');
//.action(update);

program.parse(process.argv);
