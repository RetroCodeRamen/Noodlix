
import type { FileSystem, User, CommandProcessor as ITerminalInterface } from '@/types';
import { getCommand } from './commands-registry';

const GLOBAL_ALIAS_FILE_PATH = '/etc/shellcfg/aliases';

export class ShellProcessor {
  private globalAliases: Map<string, string> = new Map();
  private userAliases: Map<string, string> = new Map();
  private userAliasFilePath: string;
  private userLocalCfgPath: string;

  constructor(
    private fileSystem: FileSystem,
    private currentUser: User,
    private terminalInterface: ITerminalInterface
  ) {
    this.userLocalCfgPath = this.fileSystem.getAbsolutePath(`${this.currentUser.homeDirectory}/localcfg`);
    this.userAliasFilePath = this.fileSystem.getAbsolutePath(`${this.userLocalCfgPath}/aliases`);
    this._loadAliases();
  }

  private _parseAliasFileContent(content: string | null): Map<string, string> {
    const aliases = new Map<string, string>();
    if (typeof content === 'string' && !content.startsWith('cat:') && !content.includes(': No such file or directory') && !content.includes(': Is a directory')) {
      const lines = content.split('\n');
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine && !trimmedLine.startsWith('#')) {
          const parts = trimmedLine.match(/^([a-zA-Z0-9_-]+)=(.*)$/);
          if (parts && parts[1] && parts[2] !== undefined) {
            aliases.set(parts[1], parts[2]);
          }
        }
      }
    } else if (content && (content.startsWith('cat:') || content.includes(': Permission denied'))) {
      // Log specific errors if needed, but don't crash.
      // console.warn(`WebNix Shell: Could not load aliases from a file: ${content}`);
    }
    return aliases;
  }

  private _loadAliases(): void {
    this.globalAliases.clear();
    this.userAliases.clear();

    const globalContent = this.fileSystem.readFile(GLOBAL_ALIAS_FILE_PATH);
    this.globalAliases = this._parseAliasFileContent(globalContent);

    const userContent = this.fileSystem.readFile(this.userAliasFilePath);
    this.userAliases = this._parseAliasFileContent(userContent);
  }

  private _saveGlobalAliases(): string | null {
    const lines: string[] = [];
    this.globalAliases.forEach((command, name) => {
      lines.push(`${name}=${command}`);
    });
    const content = lines.join('\n') + (lines.length > 0 ? '\n' : '');
    return this.fileSystem.writeFile(GLOBAL_ALIAS_FILE_PATH, content, this.currentUser);
  }

  private _saveUserAliases(): string | null {
    // Ensure user's localcfg directory exists
    const localCfgNode = this.fileSystem.getNode(this.userLocalCfgPath);
    if (!localCfgNode || localCfgNode.type !== 'dir') {
      const dirCreationResult = this.fileSystem.createDirectory(this.userLocalCfgPath, this.currentUser.username);
      if (typeof dirCreationResult === 'string' && !dirCreationResult.toLowerCase().includes("file exists")) { // "File exists" is okay if it's a dir
         // Check if it exists as a file, which is an error state we might want to report or handle
        const nodeCheck = this.fileSystem.getNode(this.userLocalCfgPath);
        if (nodeCheck && nodeCheck.type === 'file') {
            return `Error saving user aliases: '${this.userLocalCfgPath}' exists as a file, not a directory.`;
        }
        // If still not a directory after attempting creation, return error
        if (typeof dirCreationResult === 'string') {
             return `Error saving user aliases: Could not create directory '${this.userLocalCfgPath}': ${dirCreationResult}`;
        }
      }
    }


    const lines: string[] = [];
    this.userAliases.forEach((command, name) => {
      lines.push(`${name}=${command}`);
    });
    const content = lines.join('\n') + (lines.length > 0 ? '\n' : '');
    
    return this.fileSystem.writeFile(this.userAliasFilePath, content, this.currentUser);
  }

  public addAlias(name: string, command: string): { success: boolean; error?: string } {
    let error: string | null = null;
    if (this.currentUser.role === 'admin') {
      this.globalAliases.set(name, command);
      error = this._saveGlobalAliases();
    } else {
      this.userAliases.set(name, command);
      error = this._saveUserAliases();
    }
    return { success: !error, error: error || undefined };
  }

  public removeAlias(name: string): { success: boolean; found: boolean; error?: string } {
    let found: boolean;
    let error: string | null = null;

    if (this.currentUser.role === 'admin') {
      found = this.globalAliases.delete(name);
      if (found) {
        error = this._saveGlobalAliases();
      }
    } else {
      found = this.userAliases.delete(name);
      if (found) {
        error = this._saveUserAliases();
      }
    }
    return { success: !error, found, error: error || undefined };
  }
  
  public getGlobalAliases(): ReadonlyMap<string, string> {
    return this.globalAliases;
  }

  public getUserAliases(): ReadonlyMap<string, string> {
    return this.userAliases;
  }
  
  public getUserAliasFilePath(): string {
    return this.userAliasFilePath;
  }

  public resolveAlias(name: string): string | undefined {
    return this.userAliases.get(name) ?? this.globalAliases.get(name);
  }

  public async processCommand(commandLine: string): Promise<string | string[]> {
    const trimmedCmdLine = commandLine.trim();
    if (!trimmedCmdLine) {
      return ''; 
    }

    const parts = trimmedCmdLine.split(/\s+/);
    let commandNameOrAlias = parts[0];
    let remainingArgs = parts.slice(1);

    let finalCommandName = commandNameOrAlias;
    let finalArgs = remainingArgs;

    const resolvedAliasCommand = this.resolveAlias(commandNameOrAlias);
    if (resolvedAliasCommand) {
      const aliasParts = resolvedAliasCommand.split(/\s+/);
      finalCommandName = aliasParts[0];
      const aliasArgs = aliasParts.slice(1);
      finalArgs = [...aliasArgs, ...remainingArgs];
    }

    if (!finalCommandName) {
      return ''; 
    }

    const command = getCommand(finalCommandName);

    if (!command) {
      return `${finalCommandName}: command not found`;
    }

    if (command.adminOnly && this.currentUser.role !== 'admin') {
      return `${finalCommandName}: permission denied (admin only)`;
    }

    if (command.minArgs && finalArgs.length < command.minArgs) {
        return `Usage: ${finalCommandName} ${command.usage || ''}\n${finalCommandName}: missing operand(s)`;
    }

    try {
      return await command.execute(finalArgs, this.fileSystem, this.currentUser, this, this.terminalInterface);
    } catch (error) {
      console.error(`Error executing command ${finalCommandName}:`, error);
      if (error instanceof Error) {
        return `${finalCommandName}: ${error.message}`;
      }
      return `${finalCommandName}: an unknown error occurred.`;
    }
  }

  public updateUser(newUser: User) {
    this.currentUser = newUser;
    this.userLocalCfgPath = this.fileSystem.getAbsolutePath(`${this.currentUser.homeDirectory}/localcfg`);
    this.userAliasFilePath = this.fileSystem.getAbsolutePath(`${this.userLocalCfgPath}/aliases`);
    this._loadAliases(); 
  }

  public updateFileSystem(newFileSystem: FileSystem) {
    this.fileSystem = newFileSystem;
    this._loadAliases(); 
  }
}
