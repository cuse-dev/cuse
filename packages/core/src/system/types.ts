import { Mouse } from './mouse';
import { Keyboard } from './keyboard';
import { Display } from './display';
import { Bash } from './bash';
import { Editor } from './editor';

/**
 * Configuration options for the system client
 */
export interface SystemConfig {
  /** Display number to control */
  displayNum: number;
  /** Base URL for the API server */
  baseUrl: string;
}

/**
 * Mouse position coordinates
 */
export interface Position {
  /** X coordinate */
  x: number;
  /** Y coordinate */
  y: number;
}

/**
 * Parameters for mouse movement
 */
export interface MoveParams {
  /** Target X coordinate */
  x: number;
  /** Target Y coordinate */
  y: number;
}

/**
 * Parameters for mouse drag operation
 */
export interface DragParams {
  /** Target X coordinate to drag to */
  x: number;
  /** Target Y coordinate to drag to */
  y: number;
}

/**
 * Mouse control interface for controlling cursor movement and clicks
 */
export interface MouseInterface {
  /** Get current cursor position */
  getPosition(): Promise<Position>;
  /** Move cursor to specific coordinates */
  move(params: MoveParams): Promise<void>;
  /** Perform a left click at current cursor position */
  leftClick(): Promise<void>;
  /** Perform a right click at current cursor position */
  rightClick(): Promise<void>;
  /** Perform a middle click at current cursor position */
  middleClick(): Promise<void>;
  /** Perform a double click at current cursor position */
  doubleClick(): Promise<void>;
  /** Perform a left click and drag to target coordinates */
  leftClickDrag(params: DragParams): Promise<void>;
}

/**
 * Parameters for key press operation
 */
export interface PressKeyParams {
  /** The key to press (e.g. 'a', 'enter', 'shift') */
  key: string;
}

/**
 * Parameters for text typing operation
 */
export interface TypeParams {
  /** The text string to type */
  text: string;
}

/**
 * Keyboard control interface for simulating keyboard input
 */
export interface KeyboardInterface {
  /** Press a single key on the keyboard */
  pressKey(params: PressKeyParams): Promise<void>;
  /** Type a sequence of text as keyboard input */
  type(params: TypeParams): Promise<void>;
}

/**
 * Display control interface for screen operations
 */
export interface DisplayInterface {
  /** Take a screenshot of the current display state */
  getScreenshot(): Promise<File | Blob>;
}

/**
 * File system entry information representing a file or directory
 */
export interface FileSystemEntry {
  /** Name of the file or directory */
  name: string;
  /** Full path to the file or directory */
  path: string;
  /** Type of the filesystem entry */
  type: 'file' | 'directory';
  /** Size of the file in bytes */
  size: number;
  /** Last modification timestamp */
  modifiedTime: string;
}

/**
 * Parameters for directory listing operation
 */
export interface ListDirectoryParams {
  /** Path to the directory to list */
  path: string;
}

/**
 * Parameters for file reading operation
 */
export interface ReadFileParams {
  /** Path to the file to read */
  path: string;
}

/**
 * Parameters for file writing operation
 */
export interface WriteFileParams {
  /** Path to the file to write */
  path: string;
  /** Content to write to the file */
  content: string;
}

/**
 * Parameters for file/directory deletion
 */
export interface DeleteParams {
  /** Path to delete */
  path: string;
}

/**
 * Parameters for directory creation
 */
export interface CreateDirectoryParams {
  /** Path where to create the directory */
  path: string;
}

/**
 * Parameters for path existence check
 */
export interface ExistsParams {
  /** Path to check */
  path: string;
}

/**
 * Parameters for getting file/directory info
 */
export interface GetInfoParams {
  /** Path to get info for */
  path: string;
}

/**
 * File system interface for managing files and directories
 */
export interface FileSystemInterface {
  /** List contents of a directory */
  listDirectory(params: ListDirectoryParams): Promise<FileSystemEntry[]>;
  /** Read contents of a file as string */
  readFile(params: ReadFileParams): Promise<string>;
  /** Write string content to a file */
  writeFile(params: WriteFileParams): Promise<void>;
  /** Delete a file or directory at the specified path */
  delete(params: DeleteParams): Promise<void>;
  /** Create a new directory at the specified path */
  createDirectory(params: CreateDirectoryParams): Promise<void>;
  /** Check if a file or directory exists at the specified path */
  exists(params: ExistsParams): Promise<boolean>;
  /** Get detailed information about a file or directory */
  getInfo(params: GetInfoParams): Promise<FileSystemEntry>;
}

/**
 * Parameters for command execution
 */
export interface ExecuteCommandParams {
  /** Command to execute */
  command: string;
}

/**
 * Bash interface for executing shell commands
 */
export interface BashInterface {
  /** Execute a shell command and get its output */
  execute(params: ExecuteCommandParams): Promise<CommandResponse>;
  /** Restart the system */
  restart(): Promise<void>;
  /** Get output from a background process */
  getProcessOutput(params: GetProcessOutputParams): Promise<CommandResponse>;
  /** Terminate a background process */
  terminateProcess(params: TerminateProcessParams): Promise<void>;
  /** List managed processes */
  listManagedProcesses(): Promise<ProcessInfo[]>;
}

/**
 * Parameters for getting process output
 */
export interface GetProcessOutputParams {
  /** Process ID */
  pid: number;
}

/**
 * Parameters for terminating a background process
 */
export interface TerminateProcessParams {
  /** Process ID */
  pid: number;
}

/**
 * Parameters for viewing file contents
 */
export interface ViewFileParams {
  /** Path to the file to view */
  path: string;
  /**
   * Optional line range to view. If provided, must be a tuple of [startLine, endLine].
   * - Both numbers are 1-indexed
   * - If not provided, shows the entire file
   * - Use -1 as endLine to show all lines from startLine to end of file
   */
  viewRange?: [number, number] | undefined;
}

/**
 * Parameters for creating a file
 */
export interface CreateFileParams {
  /** Path where to create the file */
  path: string;
  /** Optional content to write to the file */
  content?: string | undefined;
}

/**
 * Parameters for replacing strings in a file
 */
export interface ReplaceStringParams {
  /** Path to the file to modify */
  path: string;
  /** String to find and replace */
  oldStr: string;
  /** String to replace with */
  newStr: string;
}

/**
 * Parameters for inserting text in a file
 */
export interface InsertTextParams {
  /** Path to the file to modify */
  path: string;
  /** Line number where to insert the text */
  line: number;
  /** Text to insert */
  text: string;
}

/**
 * Parameters for undoing the last edit
 */
export interface UndoEditParams {
  /** Path to the file to undo */
  path: string;
}

/**
 * Editor interface for file manipulation
 */
export interface EditorInterface {
  /** View contents of a file */
  viewFile(params: ViewFileParams): Promise<string>;
  /** Create a new file with optional content */
  createFile(params: CreateFileParams): Promise<void>;
  /** Replace string occurrences in a file */
  replaceString(params: ReplaceStringParams): Promise<void>;
  /** Insert text at a specific line in a file */
  insertText(params: InsertTextParams): Promise<void>;
  /** Undo the last edit operation */
  undoLastEdit(params: UndoEditParams): Promise<void>;
}

/**
 * Complete system interface combining all control interfaces for system automation
 */
export interface SystemInterface {
  /** Mouse control for cursor movement and clicks */
  mouse: Mouse;
  /** Keyboard control for typing and key presses */
  keyboard: Keyboard;
  /** Display control for screen operations */
  display: Display;
  /** Bash control for shell command execution */
  bash: Bash;
  /** Editor control for file manipulation */
  editor: Editor;
}

export interface CommandResponse {
  output?: string | null;
  process_id?: number | null;
  status: 'completed' | 'background';
}

export interface ProcessInfo {
  pid: number;
  command: string;
  status: string;
  cpu_percent?: number | null;
  memory_percent?: number | null;
  create_time?: number | null;
}
