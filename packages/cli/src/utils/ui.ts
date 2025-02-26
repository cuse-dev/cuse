import chalk from 'chalk';
import { MultiBar, Presets, SingleBar } from 'cli-progress';
import Table from 'cli-table3';
import { Listr } from 'listr2';
import ora from 'ora';

/**
 * Create a spinner with the given text
 */
export function createSpinner(text: string) {
  return ora({
    text,
    spinner: 'dots',
    color: 'cyan',
  });
}

/**
 * Create a task list
 */
export function createTaskList<T extends Record<string, any>>(
  tasks: Array<{ title: string; task: () => Promise<any> | any }>,
  options?: { concurrent?: boolean }
) {
  return new Listr(tasks, {
    concurrent: options?.concurrent ?? false,
    rendererOptions: {
      collapseSubtasks: false,
      collapseErrors: false,
    },
  });
}

/**
 * Create a progress bar
 */
export function createProgressBar(options?: {
  total?: number;
  format?: string;
}) {
  return new SingleBar(
    {
      format: options?.format ?? ' {bar} | {percentage}% | {value}/{total}',
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
      hideCursor: true,
      ...options,
    },
    Presets.shades_classic
  );
}

/**
 * Create a multi progress bar
 */
export function createMultiProgressBar() {
  return new MultiBar(
    {
      clearOnComplete: false,
      hideCursor: true,
      format: ' {bar} | {percentage}% | {value}/{total} | {task}',
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
    },
    Presets.shades_classic
  );
}

/**
 * Create a table
 */
export function createTable(options?: { head?: string[] }) {
  return new Table({
    chars: {
      top: '─',
      'top-mid': '┬',
      'top-left': '┌',
      'top-right': '┐',
      bottom: '─',
      'bottom-mid': '┴',
      'bottom-left': '└',
      'bottom-right': '┘',
      left: '│',
      'left-mid': '├',
      mid: '─',
      'mid-mid': '┼',
      right: '│',
      'right-mid': '┤',
      middle: '│',
    },
    style: {
      head: ['cyan'],
      border: ['grey'],
    },
    head: options?.head,
  });
}

/**
 * Print a success message
 */
export function success(message: string): void {
  console.log(`${chalk.green('✓')} ${message}`);
}

/**
 * Print an error message
 */
export function error(message: string): void {
  console.error(`${chalk.red('✗')} ${message}`);
}

/**
 * Print a warning message
 */
export function warning(message: string): void {
  console.warn(`${chalk.yellow('⚠')} ${message}`);
}

// Add warn as an alias for warning
export const warn = warning;

/**
 * Print an info message
 */
export function info(message: string): void {
  console.info(`${chalk.blue('ℹ')} ${message}`);
}

/**
 * Print a section header
 */
export function section(title: string): void {
  console.log(
    `\n${chalk.bold.cyan(title)}\n${chalk.cyan('='.repeat(title.length))}\n`
  );
}

/**
 * Print a subsection header
 */
export function subsection(title: string): void {
  console.log(
    `\n${chalk.bold.cyan(title)}\n${chalk.cyan('-'.repeat(title.length))}\n`
  );
}

/**
 * Print a code block
 */
export function code(content: string): void {
  console.log(`\n${chalk.grey('```')}\n${content}\n${chalk.grey('```')}\n`);
}

/**
 * Print a URL
 */
export function url(label: string, url: string): void {
  console.log(`${label}: ${chalk.underline.cyan(url)}`);
}

/**
 * Print a command
 */
export function command(cmd: string): void {
  console.log(`${chalk.grey('$')} ${chalk.bold(cmd)}`);
}
