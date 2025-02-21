import * as client from './client';
import type {
  CreateFileParams,
  EditorInterface,
  InsertTextParams,
  ReplaceStringParams,
  SystemConfig,
  UndoEditParams,
  ViewFileParams,
} from './types';

/**
 * Editor control implementation
 * Provides functionality for file manipulation operations
 */
export class Editor implements EditorInterface {
  constructor(private config: SystemConfig) {}

  /**
   * View contents of a file
   * @param params File viewing parameters
   * @returns Promise with file contents
   * @throws Error if file viewing fails
   */
  async viewFile({ path, viewRange }: ViewFileParams): Promise<string> {
    const response = await client.viewFile({
      body: {
        path,
        view_range: viewRange ?? null,
      },
    });

    if (!response.data) {
      throw new Error('Failed to view file');
    }

    return response.data as string;
  }

  /**
   * Create a new file with optional content
   * @param params File creation parameters
   * @throws Error if file creation fails
   */
  async createFile({ path, content }: CreateFileParams): Promise<void> {
    await client.createFile({
      body: {
        path,
        file_text: content ?? null,
      },
    });
  }

  /**
   * Replace string occurrences in a file
   * @param params String replacement parameters
   * @throws Error if string replacement fails
   */
  async replaceString({
    path,
    oldStr,
    newStr,
  }: ReplaceStringParams): Promise<void> {
    await client.replaceString({
      body: { path, old_str: oldStr, new_str: newStr },
    });
  }

  /**
   * Insert text at a specific line in a file
   * @param params Text insertion parameters
   * @throws Error if text insertion fails
   */
  async insertText({ path, line, text }: InsertTextParams): Promise<void> {
    await client.insertText({
      body: { path, insert_line: line, text },
    });
  }

  /**
   * Undo the last edit operation
   * @param params Undo parameters
   * @throws Error if undo operation fails
   */
  async undoLastEdit({ path }: UndoEditParams): Promise<void> {
    await client.undoEdit({
      body: { path },
    });
  }
}
