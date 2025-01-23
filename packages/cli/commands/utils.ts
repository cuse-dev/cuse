import inquirer from 'inquirer';
import { haiku } from '../utils/haiku';

export const supportedOS = ['linux', 'browser'];

export async function chooseOS(osArg?: string): Promise<string> {
  if (osArg && supportedOS.includes(osArg)) return osArg;

  const { chosenOS } = await inquirer.prompt([
    {
      type: 'list',
      name: 'chosenOS',
      message: 'Select the operating system:',
      choices: supportedOS.map((os) => ({ name: os, value: os })),
      default: 'linux',
    },
  ]);
  return chosenOS;
}

export function validateIdentifier(name: string): string {
  // Replace whitespace, slashes, and hyphens with underscores and remove any other disallowed characters
  const sanitized = name
    .replace(/[\s/-]/g, '_')
    .replace(/[^a-zA-Z0-9_.-]/g, '');

  // Ensure it starts with an allowed character
  return /^[a-zA-Z0-9]/.test(sanitized) ? sanitized : `${sanitized}`;
}

export async function chooseIdentifier(
  identifierArg?: string
): Promise<string> {
  let defaultIdentifier = identifierArg || haiku();

  // Validate and sanitize the default name
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/.test(defaultIdentifier)) {
    defaultIdentifier = validateIdentifier(defaultIdentifier);
  }

  const { identifier } = await inquirer.prompt([
    {
      type: 'input',
      name: 'identifier',
      message: 'Enter a name for this computer:',
      default: defaultIdentifier,
      validate: (input: string) => {
        if (!input) return 'Name cannot be empty';
        if (!/^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/.test(input)) {
          return 'Name can only contain letters, numbers, dots, dashes, and underscores, and must start with a letter or number';
        }
        return true;
      },
    },
  ]);
  return identifier || defaultIdentifier;
}
