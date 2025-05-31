
import type { Command, FileSystem, User, FileSystemEntry, CommandProcessor as ITerminalInterface, FileNode } from '@/types';
import type { ShellProcessor } from '@/core/shell-processor';
import { format } from 'date-fns';
import { AuthService } from './auth-service';


const commandsList: Command[] = [];

function registerCommand(command: Command): void {
  commandsList.push(command);
}

// Helper to format ls -l output
function formatLongListEntry(entry: FileSystemEntry, isDir: boolean): string {
  const typeChar = isDir ? 'd' : '-';
  const date = format(new Date(entry.modifiedAt), 'MMM dd HH:mm');
  // Simplified size display
  const size = entry.size.toString().padStart(5);
  return `${typeChar}${entry.permissions} 1 ${entry.owner.padEnd(8)} ${entry.owner.padEnd(8)} ${size} ${date} ${entry.name}`;
}

registerCommand({
  name: 'help',
  description: 'Show this help message.',
  async execute(_args, _fs, _currentUser, _shell, _terminalInterface) {
    const outputLines: string[] = ['Available commands:'];
    const assumedTerminalWidth = 78; 
    const commandNameDisplayLength = 12; 
    const separator = " - ";
    const initialLineIndent = "  "; 

    commandsList.forEach(cmd => {
        const commandPart = `${initialLineIndent}${cmd.name.padEnd(commandNameDisplayLength)}${separator}`;
        let descriptionText = cmd.description;
        if (cmd.usage) {
            descriptionText += ` (Usage: ${cmd.name} ${cmd.usage})`;
        }

        const firstLineDescMaxWidth = assumedTerminalWidth - commandPart.length;
        const descriptionContinuationIndent = ' '.repeat(commandPart.length);
        const subsequentLinesDescMaxWidth = assumedTerminalWidth - descriptionContinuationIndent.length;

        const words = descriptionText.split(' ');
        let currentLineFragments: string[] = [];
        let currentLineLength = 0;
        let isFirstLineOfDescription = true;
        let currentLine = "";

        for (const word of words) {
            const wordWithSpace = (currentLineFragments.length > 0 ? " " : "") + word;
            const wordWithSpaceLength = wordWithSpace.length;
            const maxWidthForThisLine = isFirstLineOfDescription ? firstLineDescMaxWidth : subsequentLinesDescMaxWidth;

            if (currentLineLength + wordWithSpaceLength <= maxWidthForThisLine) {
                currentLineFragments.push(word);
                currentLineLength += wordWithSpaceLength;
            } else {
                // Line is full
                if (isFirstLineOfDescription) {
                    currentLine = commandPart + currentLineFragments.join(' ');
                    isFirstLineOfDescription = false;
                } else {
                    currentLine = descriptionContinuationIndent + currentLineFragments.join(' ');
                }
                outputLines.push(currentLine);
                currentLineFragments = [word]; // Start new line with current word
                currentLineLength = word.length;
            }
        }
        
        // Add the last constructed line
        if (currentLineFragments.length > 0) {
            if (isFirstLineOfDescription) {
                currentLine = commandPart + currentLineFragments.join(' ');
            } else {
                currentLine = descriptionContinuationIndent + currentLineFragments.join(' ');
            }
            outputLines.push(currentLine);
        }
    });
    return outputLines;
  },
});

registerCommand({
  name: 'whoami',
  description: 'Print the current user name.',
  async execute(_args, _fs, currentUser, _shell, _terminalInterface) {
    return currentUser.username;
  },
});

registerCommand({
  name: 'pwd',
  description: 'Print the current working directory.',
  async execute(_args, fs, _currentUser, _shell, _terminalInterface) {
    return fs.getCurrentPath();
  },
});

registerCommand({
  name: 'cd',
  description: 'Change the current directory.',
  usage: '<directory>',
  minArgs: 1,
  async execute(args, fs, user, _shell, _terminalInterface) {
    const targetPath = args[0];
    const currentPathBeforeCd = fs.getCurrentPath();
    const absolutePath = fs.getAbsolutePath(targetPath);
    const node = fs.getNode(absolutePath);

    if (!node) return `cd: ${targetPath}: No such file or directory`;
    if (node.type !== 'dir') return `cd: ${targetPath}: Not a directory`;
    if (!fs.checkPermission(node, user, 'execute')) return `cd: ${targetPath}: Permission denied`;
    
    fs.setCurrentPath(absolutePath);
    if (fs.getCurrentPath() === currentPathBeforeCd && currentPathBeforeCd !== absolutePath) {
        return `cd: ${targetPath}: Permission denied or error changing directory.`;
    }
    return '';
  },
});

registerCommand({
  name: 'ls',
  description: 'List directory contents.',
  usage: '[-la] [directory]',
  async execute(args, fs, user, _shell, _terminalInterface) {
    let targetPath = fs.getCurrentPath();
    let showHidden = false;
    let longFormat = false;

    for (const arg of args) {
        if (arg.startsWith('-')) {
            if (arg.includes('a')) showHidden = true;
            if (arg.includes('l')) longFormat = true;
        } else {
            targetPath = arg;
        }
    }
    
    const absolutePath = fs.getAbsolutePath(targetPath);
    const node = fs.getNode(absolutePath);

    if (!node) return `ls: cannot access '${targetPath}': No such file or directory`;
    if (!fs.checkPermission(node, user, 'read')) return `ls: cannot open directory '${targetPath}': Permission denied`;

    const entries = fs.listDirectory(absolutePath, showHidden);
    if (typeof entries === 'string') return entries; 

    if (longFormat) {
      return entries.map(entry => formatLongListEntry(entry, entry.type === 'dir'));
    } else {
      return entries.map(entry => entry.name).join('  ');
    }
  },
});

registerCommand({
  name: 'mkdir',
  description: 'Create a directory.',
  usage: '<directory_name>',
  minArgs: 1,
  async execute(args, fs, currentUser, _shell, _terminalInterface) {
    const result = fs.createDirectory(args[0], currentUser.username);
    return typeof result === 'string' ? result : '';
  },
});

registerCommand({
  name: 'touch',
  description: 'Create an empty file or update timestamp.',
  usage: '<file_name>',
  minArgs: 1,
  async execute(args, fs, currentUser, _shell, _terminalInterface) {
    const result = fs.createFile(args[0], currentUser.username);
    return typeof result === 'string' ? result : '';
  },
});

registerCommand({
  name: 'cat',
  description: 'Concatenate and print files.',
  usage: '<file_name>',
  minArgs: 1,
  async execute(args, fs, _currentUser, _shell, _terminalInterface) {
    const content = fs.readFile(args[0]);
    if (content === null || content.startsWith('cat:') || content.startsWith(fs.getAbsolutePath(args[0]) + ':')) return content || `cat: ${args[0]}: Unknown error`; 
    return content;
  },
});

registerCommand({
  name: 'clear',
  description: 'Clear the terminal screen.',
  async execute(_args, _fs, _currentUser, _shell, _terminalInterface) {
    return '__CLEAR__';
  },
});

registerCommand({
  name: 'cls',
  description: 'Clear the terminal screen (alias for clear).',
  async execute(_args, _fs, _currentUser, _shell, _terminalInterface) {
    return '__CLEAR__';
  },
});

registerCommand({
  name: 'logout',
  description: 'Log out the current user.',
  async execute(_args, _fs, _currentUser, _shell, _terminalInterface) {
    return '__LOGOUT__';
  }
});

registerCommand({
    name: 'wget',
    description: 'Download a file from a URL.',
    usage: '<url> [filename]',
    minArgs: 1,
    async execute(args, fs, currentUser, _shell, _terminalInterface) {
        const url = args[0];
        const filename = args[1] || url.substring(url.lastIndexOf('/') + 1) || 'downloaded_file';
        const filePath = fs.getAbsolutePath(fs.getCurrentPath() + '/' + filename);

        try {
            const response = await fetch(url);
            if (!response.ok) {
                return `wget: failed to download from ${url}: ${response.statusText}`;
            }
            const content = await response.text(); 
            
            const parentDir = fs.getNode(fs.getAbsolutePath(filePath + '/..'));
            if (!parentDir || parentDir.type !== 'dir' || !fs.checkPermission(parentDir, currentUser, 'write')) {
                return `wget: cannot write to '${filename}': Permission denied in target directory.`;
            }

            const writeResult = fs.writeFile(filePath, content, currentUser);
            if (writeResult !== null) { 
                return `wget: failed to save file '${filename}': ${writeResult}`;
            }
            return `wget: '${filename}' saved successfully. (${content.length} bytes)`;
        } catch (error) {
            if (error instanceof Error) {
                 return `wget: error downloading from ${url}: ${error.message}`;
            }
            return `wget: unknown error downloading from ${url}`;
        }
    }
});

registerCommand({
  name: 'note',
  description: 'Simple text editor.',
  usage: '<filename>',
  minArgs: 1,
  async execute(args, fs, currentUser, _shell, _terminalInterface) {
    const filename = args[0];
    const absolutePath = fs.getAbsolutePath(filename);
    
    const existingNode = fs.getNode(absolutePath);
    if (existingNode) {
        if (existingNode.type === 'dir') return `note: ${filename}: Is a directory`;
        if (!fs.checkPermission(existingNode, currentUser, 'read')) return `note: ${filename}: Permission denied (read)`;
    } else {
        const parentPath = fs.getAbsolutePath(absolutePath + '/..');
        const parentNode = fs.getNode(parentPath);
        if (!parentNode || parentNode.type !== 'dir' || !fs.checkPermission(parentNode, currentUser, 'write')) {
            return `note: ${filename}: Permission denied (write to directory)`;
        }
    }
    return `__NOTE_EDIT__${JSON.stringify({ filename: absolutePath })}`;
  }
});

registerCommand({
  name: 'js',
  description: 'Execute JavaScript code. Use print(...) for output. Simple expressions are auto-returned.',
  usage: "<javascript_code_string>",
  minArgs: 1,
  async execute(args, _fs, _currentUser, _shell, _terminalInterface) {
    const rawScriptContent = args.join(' ');
    const outputLines: string[] = [];

    const customPrint = (...printArgs: any[]) => {
      const message = printArgs.map(arg => {
        if (typeof arg === 'function') return '[function]';
        if (typeof arg === 'object' && arg !== null) {
          try { return JSON.stringify(arg); }
          catch (e) { return '[Circular Object]'; }
        }
        return String(arg);
      }).join(' ');
      outputLines.push(message);
    };
    
    let codeToExecute = rawScriptContent;
    if ((codeToExecute.startsWith("'") && codeToExecute.endsWith("'")) ||
        (codeToExecute.startsWith('"') && codeToExecute.endsWith('"'))) {
      codeToExecute = codeToExecute.substring(1, codeToExecute.length - 1);
    }
    
    try {
      let executionBody = codeToExecute.trim();
      
      const isLikelySimpleExpression =
        executionBody !== '' &&
        !executionBody.includes(';') && 
        !executionBody.includes('\n') &&
        !/\b(var|let|const|if|for|while|function|class|return|throw|try|yield|await|async|import|export|debugger|switch|with)\b/.test(executionBody);

      if (isLikelySimpleExpression && !executionBody.startsWith('return ')) {
        executionBody = `return (${executionBody});`;
      }

      const functionBody = `"use strict"; ${executionBody}`;
      const sandboxedExecutor = new Function('print', functionBody);
      
      const returnValue = sandboxedExecutor(customPrint);

      if (returnValue !== undefined) {
        let returnValueString: string;
        if (typeof returnValue === 'function') {
          returnValueString = '[function]';
        } else if (returnValue === null) {
          returnValueString = 'null';
        } else if (typeof returnValue === 'object') {
          try { returnValueString = JSON.stringify(returnValue); }
          catch (e) { return '[Circular Object]'; }
        } else {
          returnValueString = String(returnValue);
        }
        
        if (returnValueString && (outputLines.length === 0 || outputLines[outputLines.length -1] !== returnValueString)) {
           outputLines.push(returnValueString);
        }
      }
      
      return outputLines.length > 0 ? outputLines : '';

    } catch (error: any) {
        if (error instanceof SyntaxError) {
            return ["Error: " + `SyntaxError: ${error.message}`];
        }
        return ["Error: " + error.message];
    }
  },
});

registerCommand({
  name: 'jsrun',
  description: 'Execute a JavaScript file from the filesystem.',
  usage: '<filepath>',
  minArgs: 1,
  async execute(args, fs, currentUser, _shell, _terminalInterface) {
    const filePathArg = args[0];
    const absolutePath = fs.getAbsolutePath(filePathArg);
    const node = fs.getNode(absolutePath);

    if (!node) {
      return `jsrun: ${filePathArg}: No such file or directory`;
    }
    if (node.type !== 'file') {
      return `jsrun: ${filePathArg}: Is not a file`;
    }
    if (!fs.checkPermission(node, currentUser, 'read')) {
      return `jsrun: ${filePathArg}: Permission denied`;
    }

    const scriptContent = fs.readFile(absolutePath);

    if (scriptContent === null || (typeof scriptContent === 'string' && (scriptContent.startsWith('cat:') || scriptContent.startsWith(absolutePath + ':')))) {
      return `jsrun: ${filePathArg}: Error reading file content: ${scriptContent}`;
    }
    
    const outputLines: string[] = [];
    const customPrint = (...printArgs: any[]) => {
      const message = printArgs.map(arg => {
        if (typeof arg === 'function') return '[function]';
        if (typeof arg === 'object' && arg !== null) {
          try { return JSON.stringify(arg); }
          catch (e) { return '[Circular Object]'; }
        }
        return String(arg);
      }).join(' ');
      outputLines.push(message);
    };

    try {
      const functionBody = `"use strict"; ${scriptContent}`;
      const sandboxedExecutor = new Function('print', functionBody);
      sandboxedExecutor(customPrint);
      return outputLines.length > 0 ? outputLines : '';
    } catch (runtimeError: any) {
      return [`Error executing script ${filePathArg}: ${runtimeError.message}`];
    }
  },
});

registerCommand({
  name: 'alias',
  description: 'Define or display aliases. Usage: alias name="command" or alias',
  async execute(args, _fs, currentUser, shell, _terminalInterface) {
    if (args.length === 0) {
      const output: string[] = [];
      const globalAliases = shell.getGlobalAliases();
      const userAliases = shell.getUserAliases();

      if (globalAliases.size > 0) {
        output.push('Global Aliases (/etc/shellcfg/aliases):');
        globalAliases.forEach((command, name) => {
          const safeCommand = command.includes("'") ? `"${command.replace(/"/g, '\\"')}"` : `'${command}'`;
          output.push(`alias ${name}=${safeCommand}`);
        });
        if (userAliases.size > 0) output.push(''); 
      }

      if (userAliases.size > 0) {
        output.push(`User Aliases (${shell.getUserAliasFilePath()}):`);
        userAliases.forEach((command, name) => {
          const safeCommand = command.includes("'") ? `"${command.replace(/"/g, '\\"')}"` : `'${command}'`;
          let displayString = `alias ${name}=${safeCommand}`;
          if (globalAliases.has(name)) {
            displayString += ` (overrides global)`;
          }
          output.push(displayString);
        });
      }

      if (output.length === 0) {
        return 'No aliases defined.';
      }
      return output;
    }

    const aliasDefinition = args.join(' ');
    const match = aliasDefinition.match(/^([a-zA-Z0-9_-]+)=(['"]?)(.*)\2$/);
    
    if (match && match[1] && match[3] !== undefined) {
      const name = match[1];
      let command = match[3];

      if (name === 'alias' || name === 'unalias') {
        return `alias: cannot alias command with reserved name '${name}'`;
      }
      const result = shell.addAlias(name, command);
      if (!result.success && result.error) {
        const targetFile = currentUser.role === 'admin' ? '/etc/shellcfg/aliases' : shell.getUserAliasFilePath();
        return `alias: failed to save alias to ${targetFile}: ${result.error}`;
      }
      return ''; 
    } else {
      return 'Usage: alias name=\'command\'  (e.g., alias ll=\'ls -al\')\n   or: alias name="command" or alias name=command_no_spaces';
    }
  }
});

registerCommand({
  name: 'unalias',
  description: 'Remove an alias. Usage: unalias name',
  minArgs: 1,
  async execute(args, _fs, currentUser, shell, _terminalInterface) {
    const name = args[0];
    const result = shell.removeAlias(name);
    if (!result.found) {
      return `unalias: ${name}: not found`;
    }
    if (!result.success && result.error) {
      const targetFile = currentUser.role === 'admin' ? '/etc/shellcfg/aliases' : shell.getUserAliasFilePath();
      return `unalias: ${name} removed for session, but failed to update ${targetFile}: ${result.error}`;
    }
    return '';
  }
});

// User Management Commands

registerCommand({
  name: 'useradd',
  description: 'Create a new user and their home directory.',
  usage: '<username> <password>',
  minArgs: 2,
  adminOnly: true,
  async execute(args, fs, _currentUser, _shell, _terminalInterface) {
    const username = args[0];
    const password = args[1];
    const authService = new AuthService();

    // Validate username (basic)
    if (!/^[a-z_][a-z0-9_-]*[$]?$/.test(username) || username.length > 32) {
        return 'useradd: invalid username format.';
    }
    if (username === 'root') {
        return 'useradd: cannot recreate root user.';
    }

    const homeDir = `/home/${username}`;
    const addUserResult = authService.addUser(username, password, 'user', homeDir);

    if (typeof addUserResult === 'string') {
      return `useradd: ${addUserResult}`; // Error message from AuthService
    }

    // Create home directory
    const dirResult = fs.createDirectory(homeDir, username, 'rwx------'); // Owner rwx, others no access
    if (typeof dirResult === 'string' && !dirResult.includes('File exists')) {
      // If creating home dir failed, attempt to roll back user creation (best effort)
      authService.deleteUser(username);
      return `useradd: created user '${username}' but failed to create home directory: ${dirResult}`;
    }
    
    // Create .localcfg and .localcfg/aliases for the new user
    const localCfgPath = `${homeDir}/localcfg`;
    const localCfgDirResult = fs.createDirectory(localCfgPath, username, 'rwx------');
    if (typeof localCfgDirResult === 'string' && !localCfgDirResult.includes('File exists')) {
        return `useradd: warning: could not create ${localCfgPath} for ${username}`;
    }
    const aliasFilePath = `${localCfgPath}/aliases`;
    const aliasFileResult = fs.createFile(aliasFilePath, username, ''); // Empty alias file
    if (typeof aliasFileResult === 'string' && !aliasFileResult.includes('File exists')) {
        return `useradd: warning: could not create ${aliasFilePath} for ${username}`;
    }


    return `User '${username}' created successfully with home directory '${homeDir}'.`;
  },
});

registerCommand({
  name: 'userdel',
  description: 'Delete a user.',
  usage: '[-r] <username>',
  minArgs: 1,
  adminOnly: true,
  async execute(args, fs, _currentUser, _shell, _terminalInterface) {
    let username = '';
    let removeHome = false;

    if (args[0] === '-r') {
      if (args.length < 2) return 'userdel: missing username after -r option.';
      removeHome = true;
      username = args[1];
    } else {
      username = args[0];
    }

    if (username === 'root') {
      return 'userdel: cannot delete root user.';
    }
    
    const authService = new AuthService();
    const userToDelete = authService.getUser(username);

    if (!userToDelete) {
      return `userdel: user '${username}' does not exist.`;
    }

    const success = authService.deleteUser(username);
    if (!success) {
      return `userdel: failed to delete user '${username}'.`;
    }

    if (removeHome) {
      const homeDir = userToDelete.homeDirectory;
      const deleteDirResult = fs.deleteNode(homeDir, true); // true for recursive
      if (deleteDirResult !== null) {
        return `User '${username}' deleted, but failed to remove home directory '${homeDir}': ${deleteDirResult}`;
      }
      return `User '${username}' and home directory '${homeDir}' deleted.`;
    }

    return `User '${username}' deleted.`;
  },
});

registerCommand({
  name: 'passwd',
  description: 'Change user password.',
  usage: '[username] <newpassword>',
  minArgs: 1, // At least newpassword
  async execute(args, _fs, currentUser, _shell, _terminalInterface) {
    let targetUsername: string;
    let newPassword: string;
    const authService = new AuthService();

    if (args.length === 1) {
      // Change current user's password
      targetUsername = currentUser.username;
      newPassword = args[0];
    } else if (args.length === 2) {
      // Attempt to change another user's password
      targetUsername = args[0];
      newPassword = args[1];
      if (currentUser.role !== 'admin' && currentUser.username !== targetUsername) {
        return 'passwd: Only admin can change other users\' passwords.';
      }
    } else {
      return 'passwd: incorrect usage. Usage: passwd [username] <newpassword> OR passwd <newpassword>';
    }
    
    if (newPassword.length < 1) { // Basic validation, can be improved
        return 'passwd: password cannot be empty.';
    }

    const success = authService.updateUserPassword(targetUsername, newPassword);
    if (!success) {
      return `passwd: failed to update password for '${targetUsername}'. User may not exist.`;
    }

    return `Password for '${targetUsername}' updated successfully.`;
  },
});

registerCommand({
  name: 'noodl',
  description: 'Simple text-based web browser (interactive).',
  usage: '<url>',
  minArgs: 1,
  async execute(args, _fs, _currentUser, _shell, _terminalInterface) {
    const targetUrl = args[0];
    let absoluteUrl = targetUrl;

    if (!targetUrl.match(/^https?:\/\//i)) {
      absoluteUrl = 'http://' + targetUrl;
    }
    
    try {
      new URL(absoluteUrl); // Validate URL structure
    } catch (_) {
      return `noodl: Invalid URL: ${targetUrl}`;
    }
    // Signal terminal to enter browsing mode with this URL
    return `__BROWSE_INITIATE__${absoluteUrl}`;
  },
});

registerCommand({
  name: 'chef',
  description: 'Display Noodlix manual pages (recipes).',
  usage: '<command_name>',
  minArgs: 1,
  async execute(args, fs, _currentUser, _shell, _terminalInterface) {
    const targetCommandName = args[0];
    
    if (targetCommandName.includes('/')) {
        return `chef: Invalid command name '${targetCommandName}'. Provide only the command name.`;
    }

    const recipePath = `/etc/chef/${targetCommandName}.rcp`;
    const content = fs.readFile(recipePath);

    if (content === null || 
        (typeof content === 'string' && 
         (content.startsWith('cat:') || 
          content.includes('No such file or directory') || 
          content.includes(': Is a directory') ||
          content.includes(': Permission denied')))) {
      return `chef: No recipe found for '${targetCommandName}' in /etc/chef/`;
    }
    
    if (typeof content === 'string') {
      return content.split('\n'); 
    }
    
    return `chef: Error reading recipe for '${targetCommandName}'.`;
  },
});


export function getCommand(name: string): Command | undefined {
  return commandsList.find(cmd => cmd.name === name);
}

export function getAllCommandNames(): string[] {
  return commandsList.map(cmd => cmd.name);
}
    

