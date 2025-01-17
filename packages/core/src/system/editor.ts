import { SystemConfig, UndoEditParams } from './types';
import * as client from './client';
import {
  EditorInterface,
  ViewFileParams,
  CreateFileParams,
  ReplaceStringParams,
  InsertTextParams,
} from './types';
import { handleResponse } from './utils';

/**
 * Editor control implementation
 * Provides functionality for file manipulation operations
 */
export class Editor implements EditorInterface {
  constructor(private config: SystemConfig) {}

  /**
   * View contents of a file
   * @param params Parameters containing file path and optional line range
   * @returns Promise with file contents
   * @throws Error if file viewing fails
   */
  async viewFile({ path, viewRange }: ViewFileParams): Promise<string> {
    const response = await handleResponse(
      client.editorViewFile({
        body: {
          path: path,
          ...(viewRange ? { view_range: viewRange } : {}),
        },
      })
    );

    if (!response) {
      throw new Error('Failed to view file');
    }

    return response;
  }

  /**
   * Create a new file
   * @param params Parameters containing file path and optional content
   * @throws Error if file creation fails
   */
  async createFile({ path, content }: CreateFileParams): Promise<void> {
    await handleResponse(
      client.editorCreateFile({
        body: {
          path: path,
          ...(content ? { file_text: content } : {}),
        },
      })
    );
  }

  /**
   * Replace string occurrences in a file
   * @param params Parameters containing file path and strings to replace
   * @throws Error if string replacement fails
   */
  async replaceString({
    path,
    oldStr,
    newStr,
  }: ReplaceStringParams): Promise<void> {
    await handleResponse(
      client.editorReplaceString({
        body: {
          path: path,
          old_str: oldStr,
          new_str: newStr,
        },
      })
    );
  }

  /**
   * Insert text at a specific line
   * @param params Parameters containing file path, line number and text
   * @throws Error if text insertion fails
   */
  async insertText({ path, line, text }: InsertTextParams): Promise<void> {
    await handleResponse(
      client.editorInsertText({
        body: {
          path,
          text,
          insert_line: line,
        },
      })
    );
  }

  /**
   * Undo last edit
   * @param params Parameters containing file path
   * @throws Error if undo fails
   */
  async undoLastEdit({ path }: UndoEditParams): Promise<void> {
    await handleResponse(
      client.editorUndoLastEdit({
        body: {
          path,
        },
      })
    );
  }
}
