
import type { User, FileSystemEntry, AnyFileNode, FileNode, DirectoryNode } from '@/types';
import { INITIAL_FILESYSTEM } from '@/config';

const FS_STORAGE_KEY = 'noodlix_filesystem'; // Changed from webnix_filesystem

export class FileSystemImpl implements FileSystem {
  private root: DirectoryNode;
  private currentPath: string;
  private currentUser: User | null = null;

  constructor() {
    const storedFs = localStorage.getItem(FS_STORAGE_KEY);
    if (storedFs) {
      this.root = this.deserializeNode(JSON.parse(storedFs)) as DirectoryNode;
    } else {
      this.root = this.deserializeNode(INITIAL_FILESYSTEM as any) as DirectoryNode;
      this.updateSizes(this.root);
      this.saveToLocalStorage();
    }
    this.currentPath = '/'; // Default to root, will be updated on user login
  }

  private deserializeNode(nodeData: any): AnyFileNode {
    const baseNode = {
        name: nodeData.name,
        type: nodeData.type,
        parentPath: nodeData.parentPath,
        owner: nodeData.owner,
        permissions: nodeData.permissions,
        createdAt: new Date(nodeData.createdAt),
        modifiedAt: new Date(nodeData.modifiedAt),
    };

    if (nodeData.type === 'file') {
        return {
            ...baseNode,
            content: nodeData.content,
            size: nodeData.size,
        } as FileNode;
    } else if (nodeData.type === 'dir') {
        const children: { [name: string]: AnyFileNode } = {};
        for (const childName in nodeData.children) {
            children[childName] = this.deserializeNode(nodeData.children[childName]);
        }
        return {
            ...baseNode,
            children: children,
        } as DirectoryNode;
    }
    throw new Error(`Unknown node type: ${nodeData.type}`);
  }
  
  private updateSizes(node: DirectoryNode): void {
    Object.values(node.children).forEach(child => {
      if (child.type === 'file') {
        child.size = new TextEncoder().encode(child.content).length;
      } else if (child.type === 'dir') {
        this.updateSizes(child);
      }
    });
  }

  private saveToLocalStorage(): void {
    localStorage.setItem(FS_STORAGE_KEY, JSON.stringify(this.root));
  }

  public initializeForUser(user: User): void {
    this.currentUser = user;
    this.currentPath = user.homeDirectory;
    
    const homeNode = this.getNode(user.homeDirectory);
    if (!homeNode) {
      const parts = user.homeDirectory.split('/').filter(p => p);
      let currentBuildPath = '';
      let parentNode: DirectoryNode = this.root;

      for (const part of parts) {
        currentBuildPath += '/' + part;
        let node = this.getNodeInternal(currentBuildPath, parentNode);
        if (!node) {
          const newDir = this.createDirectoryInternal(part, parentNode, user.username, part === user.username ? 'rwx------' : 'rwxr-xr-x');
          if (typeof newDir === 'string') { 
            console.error(`Failed to create part of home directory ${currentBuildPath}: ${newDir}`);
            this.currentPath = '/'; 
            return;
          }
          node = newDir;
        }
        if (node.type !== 'dir') {
            console.error(`Part of home directory path ${currentBuildPath} is not a directory.`);
            this.currentPath = '/'; 
            return;
        }
        parentNode = node;
      }
    } else if (homeNode.type !== 'dir') {
        console.error(`Home directory path ${user.homeDirectory} exists but is not a directory.`);
        this.currentPath = '/'; 
    }
    this.saveToLocalStorage();
  }
  
  public getAbsolutePath(path: string): string {
    if (path.startsWith('/')) {
      return this.normalizePath(path);
    }
    if (path === '~') {
      return this.currentUser?.homeDirectory || '/';
    }
    if (path.startsWith('~/')) {
        return this.normalizePath((this.currentUser?.homeDirectory || '/') + '/' + path.substring(2));
    }
    return this.normalizePath(this.currentPath + (this.currentPath.endsWith('/') ? '' : '/') + path);
  }

  private normalizePath(path: string): string {
    if (path === '/') return '/';
    const parts = path.split('/').filter(p => p);
    const normalizedParts: string[] = [];
    for (const part of parts) {
      if (part === '..') {
        normalizedParts.pop();
      } else if (part !== '.') {
        normalizedParts.push(part);
      }
    }
    return '/' + normalizedParts.join('/') || '/';
  }
  
  private getNodeInternal(path: string, startNode: DirectoryNode = this.root): AnyFileNode | null {
    const parts = path.split('/').filter(p => p);
    let currentNode: AnyFileNode = startNode;

    if (path === '/') return this.root;

    for (const part of parts) {
      if (currentNode.type !== 'dir') return null;
      const children = (currentNode as DirectoryNode).children;
      if (!children || !children[part]) return null;
      currentNode = children[part];
    }
    return currentNode;
  }

  public getNode(path: string): AnyFileNode | null {
    const absolutePath = this.getAbsolutePath(path);
    return this.getNodeInternal(absolutePath);
  }

  public getCurrentPath(): string {
    return this.currentPath;
  }

  public setCurrentPath(path: string): void {
    const absolutePath = this.getAbsolutePath(path);
    const node = this.getNode(absolutePath);
    if (node && node.type === 'dir') {
      if (this.currentUser && this.checkPermission(node, this.currentUser, 'execute')) { 
        this.currentPath = absolutePath;
      } else if (!this.currentUser) { 
        this.currentPath = absolutePath;
      }
    }
  }

  public listDirectory(path: string, showHidden: boolean = false): FileSystemEntry[] | string {
    const absolutePath = this.getAbsolutePath(path);
    const node = this.getNode(absolutePath);

    if (!node) return `ls: cannot access '${path}': No such file or directory`;
    if (node.type !== 'dir') return `ls: cannot access '${path}': Not a directory`;
    if (this.currentUser && !this.checkPermission(node, this.currentUser, 'read')) {
      return `ls: cannot open directory '${path}': Permission denied`;
    }
    
    const dirNode = node as DirectoryNode;
    const entries: FileSystemEntry[] = Object.values(dirNode.children)
      .filter(child => showHidden || !child.name.startsWith('.'))
      .map(child => ({
        name: child.name,
        type: child.type,
        size: child.type === 'file' ? (child as FileNode).size : 0, 
        modifiedAt: child.modifiedAt,
        permissions: child.permissions,
        owner: child.owner,
      }));
    
    if (showHidden) {
        entries.unshift({
            name: '.', type: 'dir', size: 0, modifiedAt: dirNode.modifiedAt, permissions: dirNode.permissions, owner: dirNode.owner
        });
        if (absolutePath !== '/') {
            const parentNode = this.getNode(this.normalizePath(absolutePath + '/..'));
            if (parentNode) {
                entries.unshift({
                    name: '..', type: 'dir', size: 0, modifiedAt: parentNode.modifiedAt, permissions: parentNode.permissions, owner: parentNode.owner
                });
            }
        }
    }
    
    return entries.sort((a, b) => a.name.localeCompare(b.name));
  }

  private createDirectoryInternal(name: string, parentNode: DirectoryNode, owner: string, permissions: string = 'rwxr-xr-x'): DirectoryNode | string {
      if (parentNode.children[name]) return `mkdir: cannot create directory ‘${name}’: File exists`;
      
      const newDir: DirectoryNode = {
        name,
        type: 'dir',
        parentPath: this.getAbsolutePath(parentNode.name === '/' ? `/${name}`: `${parentNode.parentPath}/${parentNode.name}/${name}`),
        owner,
        permissions,
        createdAt: new Date(),
        modifiedAt: new Date(),
        children: {},
      };
      parentNode.children[name] = newDir;
      parentNode.modifiedAt = new Date();
      this.saveToLocalStorage();
      return newDir;
  }

  public createDirectory(path: string, owner: string, permissions: string = 'rwxr-xr-x'): DirectoryNode | string {
    const absolutePath = this.getAbsolutePath(path);
    const parentPath = this.normalizePath(absolutePath + '/..');
    const dirName = absolutePath.substring(parentPath.length === 1 ? 1 : parentPath.length + 1);

    if (!dirName) return `mkdir: invalid directory name ''`;

    const parentNode = this.getNode(parentPath);
    if (!parentNode) return `mkdir: cannot create directory ‘${path}’: No such file or directory`;
    if (parentNode.type !== 'dir') return `mkdir: cannot create directory ‘${path}’: Parent is not a directory`;
    
    if (this.currentUser && !this.checkPermission(parentNode, this.currentUser, 'write')) {
      return `mkdir: cannot create directory '${path}': Permission denied`;
    }

    return this.createDirectoryInternal(dirName, parentNode as DirectoryNode, owner, permissions);
  }
  
  public createFile(path: string, owner: string, content: string = ''): FileNode | string {
    const absolutePath = this.getAbsolutePath(path);
    const parentPath = this.normalizePath(absolutePath + '/..');
    const fileName = absolutePath.substring(parentPath.length === 1 ? 1 : parentPath.length + 1);

    if (!fileName) return `touch: invalid file name ''`;

    const parentNode = this.getNode(parentPath);
    if (!parentNode) return `touch: cannot create file ‘${path}’: No such file or directory`;
    if (parentNode.type !== 'dir') return `touch: cannot create file ‘${path}’: Parent is not a directory`;

    if (this.currentUser && !this.checkPermission(parentNode, this.currentUser, 'write')) {
      return `touch: cannot create file '${path}': Permission denied`;
    }

    if ((parentNode as DirectoryNode).children[fileName]) {
      const existingNode = (parentNode as DirectoryNode).children[fileName];
      existingNode.modifiedAt = new Date();
      this.saveToLocalStorage();
      return existingNode as FileNode; 
    }

    const newFile: FileNode = {
      name: fileName,
      type: 'file',
      parentPath: parentPath,
      owner,
      permissions: 'rw-r--r--', 
      createdAt: new Date(),
      modifiedAt: new Date(),
      content,
      size: new TextEncoder().encode(content).length,
    };
    (parentNode as DirectoryNode).children[fileName] = newFile;
    (parentNode as DirectoryNode).modifiedAt = new Date();
    this.saveToLocalStorage();
    return newFile;
  }

  public readFile(path: string): string | null {
    const node = this.getNode(path);
    if (!node) return `cat: ${path}: No such file or directory`;
    if (node.type !== 'file') return `cat: ${path}: Is a directory`;
    if (this.currentUser && !this.checkPermission(node, this.currentUser, 'read')) {
      return `cat: ${path}: Permission denied`;
    }
    return (node as FileNode).content;
  }

  public writeFile(path: string, content: string, user: User): string | null {
    const node = this.getNode(path);
    if (node && node.type === 'dir') return `writeFile: ${path}: Is a directory`;

    if (node && !this.checkPermission(node, user, 'write')) {
      return `writeFile: ${path}: Permission denied`;
    }
    
    if (!node) {
        const parentPath = this.normalizePath(this.getAbsolutePath(path) + '/..');
        const parentNode = this.getNode(parentPath);
        if (!parentNode || parentNode.type !== 'dir' || !this.checkPermission(parentNode, user, 'write')) {
            return `writeFile: ${path}: Permission denied or parent directory does not exist`;
        }
    }

    const file = this.createFile(path, user.username, content); 
    if (typeof file === 'string') return file; 

    file.content = content;
    file.size = new TextEncoder().encode(content).length;
    file.modifiedAt = new Date();
    this.saveToLocalStorage();
    return null; 
  }

  public deleteNode(path: string, recursive: boolean = false): string | null {
    const absolutePath = this.getAbsolutePath(path);
    if (absolutePath === '/' || absolutePath === '/home' || absolutePath === '/root' || absolutePath === '/etc' || absolutePath === '/bin' || absolutePath === '/tmp') {
        return `rm: cannot remove system directory '${absolutePath}'`;
    }

    const node = this.getNode(absolutePath);
    if (!node) return `rm: cannot remove '${path}': No such file or directory`;

    const parentPath = this.normalizePath(absolutePath + '/..');
    const parentNode = this.getNode(parentPath) as DirectoryNode | null;

    if (!parentNode) return `rm: critical error, cannot find parent for '${path}'`;
    
    if (this.currentUser && (!this.checkPermission(node, this.currentUser, 'write') || !this.checkPermission(parentNode, this.currentUser, 'write'))) {
        return `rm: cannot remove '${path}': Permission denied`;
    }
    
    if (node.type === 'dir' && Object.keys((node as DirectoryNode).children).length > 0 && !recursive) {
        return `rm: cannot remove '${path}': Directory not empty. Use -r to remove recursively.`;
    }

    delete parentNode.children[node.name];
    parentNode.modifiedAt = new Date();
    this.saveToLocalStorage();
    return null; 
  }

  public getPrompt(user: User): string {
    let pathForPrompt = this.currentPath;
    if (pathForPrompt.startsWith(user.homeDirectory) && user.homeDirectory !== '/') {
        pathForPrompt = '~' + pathForPrompt.substring(user.homeDirectory.length);
    }
    if (pathForPrompt === '') pathForPrompt = '/'; // Handles case where home is '/' and current path is also '/'
    
    return `${user.username}@noodlix:${pathForPrompt || '/'}# `; // Changed from webnix
  }

  public getWelcomeMessage(): string[] {
    const motd = this.readFile('/etc/motd');
    const welcomeLines = [
        "Welcome to Noodlix v1.0 (Bashimi Shell)", // Updated
    ];
    if (typeof motd === 'string' && !motd.startsWith('cat:')) {
        welcomeLines.push(motd);
    }
    welcomeLines.push(`Current user: ${this.currentUser?.username || 'guest'}`);
    welcomeLines.push(`Home directory: ${this.currentUser?.homeDirectory || '/'}`);
    welcomeLines.push(`This terminal is a product of RetroCodeRamen.`);
    welcomeLines.push(`Type "help" for a list of commands.`);
    return welcomeLines;
  }
  
  public toJSON(): string {
    return JSON.stringify(this.root);
  }

  public fromJSON(jsonString: string): void {
    this.root = this.deserializeNode(JSON.parse(jsonString)) as DirectoryNode;
    this.updateSizes(this.root); 
    this.saveToLocalStorage(); 
  }

  public checkPermission(node: AnyFileNode, user: User, permission: 'read' | 'write' | 'execute'): boolean {
    if (user.role === 'admin') return true; 

    const ownerPermissions = node.permissions.substring(1, 4);
    const otherPermissions = node.permissions.substring(7, 10);

    let effectivePermissions = otherPermissions;
    if (node.owner === user.username) {
        effectivePermissions = ownerPermissions;
    }
    
    const permissionMap = { 'r': 0, 'w': 1, 'x': 2 };
    const permChar = permission === 'read' ? 'r' : permission === 'write' ? 'w' : 'x';
    
    return effectivePermissions[permissionMap[permChar]] === permChar;
  }
}
