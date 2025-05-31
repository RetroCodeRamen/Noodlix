
import type { ShellProcessor } from '@/core/shell-processor';

export interface User {
  username: string;
  password?: string; // Plaintext password for simplicity in this prototype
  role: 'admin' | 'user';
  homeDirectory: string;
  lastLogin?: Date;
}

export type FileSystemNodeType = 'file' | 'dir';

export interface FileSystemBaseNode {
  name: string;
  type: FileSystemNodeType;
  parentPath: string;
  owner: string; // username
  permissions: string; // rwx notation e.g. "rwxr-xr--"
  createdAt: Date;
  modifiedAt: Date;
}

export interface FileNode extends FileSystemBaseNode {
  type: 'file';
  content: string; // For text files; could be ArrayBuffer for binary
  size: number;
}

export interface DirectoryNode extends FileSystemBaseNode {
  type: 'dir';
  children: { [name: string]: FileNode | DirectoryNode };
}

export type AnyFileNode = FileNode | DirectoryNode;

export interface FileSystemEntry {
  name: string;
  type: FileSystemNodeType;
  size: number;
  modifiedAt: Date;
  permissions: string;
  owner: string;
}

export interface Command {
  name: string;
  description: string;
  usage?: string;
  execute: (
    args: string[],
    fileSystem: FileSystem,
    currentUser: User,
    shell: ShellProcessor, // The shell instance for managing shell state like aliases
    terminalInterface: CommandProcessor // For UI interactions like nano, or programmatic command execution
  ) => Promise<string | string[]>;
  adminOnly?: boolean;
  minArgs?: number;
}

// Forward declaration to avoid circular dependencies
export interface FileSystem {
  getCurrentPath(): string;
  setCurrentPath(path: string): void;
  getNode(path: string): AnyFileNode | null;
  listDirectory(path: string, showHidden?: boolean): FileSystemEntry[] | string;
  createDirectory(path: string, owner: string, permissions?: string): DirectoryNode | string;
  createFile(path: string, owner: string, content?: string): FileNode | string;
  readFile(path: string): string | null;
  writeFile(path: string, content: string, user: User): string | null;
  deleteNode(path: string, recursive?: boolean): string | null;
  getPrompt(user: User): string;
  getWelcomeMessage(): string[];
  initializeForUser(user: User): void;
  toJSON(): string;
  fromJSON(jsonString: string): void;
  checkPermission(node: AnyFileNode, user: User, permission: 'read' | 'write' | 'execute'): boolean;
  getAbsolutePath(path: string): string;
}

export interface CommandProcessor {
  executeCommand(commandLine: string): Promise<void>;
  typeCommand(commandLine: string, speed?: number): Promise<void>;
}

export interface OutputLine {
  id: string;
  text: string | string[];
  isCommand?: boolean;
  isError?: boolean;
  prompt?: string;
}

export interface LinkEntry {
  text: string;
  href: string;
}
