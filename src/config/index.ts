import type { User } from '@/types';

// Default root password - should be changed immediately after first login
export const DEFAULT_ROOT_PASSWORD = 'toor';

export const DEFAULT_USERS: User[] = [
  {
    username: 'root',
    password: DEFAULT_ROOT_PASSWORD,
    role: 'admin',
    homeDirectory: '/root',
  },
];


export const INITIAL_FILESYSTEM = {
  name: '/',
  type: 'dir' as 'dir',
  parentPath: '',
  owner: 'root',
  permissions: 'rwxr-xr-x',
  createdAt: new Date(),
  modifiedAt: new Date(),
  children: {
    home: {
      name: 'home',
      type: 'dir' as 'dir',
      parentPath: '/',
      owner: 'root',
      permissions: 'rwxr-xr-x',
      createdAt: new Date(),
      modifiedAt: new Date(),
      children: {},
    },
    root: {
      name: 'root',
      type: 'dir' as 'dir',
      parentPath: '/',
      owner: 'root',
      permissions: 'rwx------',
      createdAt: new Date(),
      modifiedAt: new Date(),
      children: {
        'welcome.txt': {
          name: 'welcome.txt',
          type: 'file' as 'file',
          parentPath: '/root',
          owner: 'root',
          permissions: 'rw-r--r--',
          content: 'Welcome to Noodlix (Bashimi Shell)!\nThis terminal is a product of RetroCodeRamen.\nType "help" to see available commands.',
          size: 0,
          createdAt: new Date(),
          modifiedAt: new Date(),
        }
      },
    },
    tmp: {
      name: 'tmp',
      type: 'dir' as 'dir',
      parentPath: '/',
      owner: 'root',
      permissions: 'rwxrwxrwt',
      createdAt: new Date(),
      modifiedAt: new Date(),
      children: {},
    },
    etc: {
      name: 'etc',
      type: 'dir' as 'dir',
      parentPath: '/',
      owner: 'root',
      permissions: 'rwxr-xr-x',
      createdAt: new Date(),
      modifiedAt: new Date(),
      children: {
        'motd': {
            name: 'motd',
            type: 'file' as 'file',
            parentPath: '/etc',
            owner: 'root',
            permissions: 'rw-r--r--',
            content: 'Noodlix - Your RetroCodeRamen Terminal Environment (Bashimi Shell).',
            size: 0,
            createdAt: new Date(),
            modifiedAt: new Date(),
        },
        shellcfg: {
          name: 'shellcfg',
          type: 'dir' as 'dir',
          parentPath: '/etc',
          owner: 'root',
          permissions: 'rwxr-xr-x',
          createdAt: new Date(),
          modifiedAt: new Date(),
          children: {
            'aliases': {
              name: 'aliases',
              type: 'file' as 'file',
              parentPath: '/etc/shellcfg',
              owner: 'root',
              permissions: 'rw-r--r--',
              content: '', // Initially empty, users/system can add
              size: 0,
              createdAt: new Date(),
              modifiedAt: new Date(),
            }
          }
        },
        chef: {
          name: 'chef',
          type: 'dir' as 'dir',
          parentPath: '/etc',
          owner: 'root',
          permissions: 'rwxr-xr-x',
          createdAt: new Date(),
          modifiedAt: new Date(),
          children: {
            'ls.rcp': {
              name: 'ls.rcp',
              type: 'file' as 'file',
              parentPath: '/etc/chef',
              owner: 'root',
              permissions: 'rw-r--r--',
              content: `NAME
  ls - list directory contents

SYNOPSIS
  ls [-la] [directory]

DESCRIPTION
  Lists information about files and directories in the current directory or specified directory.
  By default, ls lists files in a simple format, showing only file names.
  Hidden files (those starting with .) are not shown unless the -a option is used.

OPTIONS
  -l    Use long listing format, showing:
        - File permissions
        - Owner
        - Size
        - Last modified date/time
        - File/directory name
  -a    Do not ignore entries starting with . (show hidden files)

EXAMPLES
  ls              # List files in current directory
  ls /etc         # List files in /etc directory
  ls -l           # List files with detailed information
  ls -a           # List all files, including hidden ones
  ls -la          # List all files with detailed information

PERMISSIONS
  Requires read permission on the target directory.

ERRORS
  ls: cannot access 'directory': No such file or directory
    - The specified directory does not exist
  ls: cannot open directory 'directory': Permission denied
    - You don't have read permission for the directory

SEE ALSO
  cd(1), pwd(1), mkdir(1)`,
              size: 0,
              createdAt: new Date(),
              modifiedAt: new Date(),
            },
            'cd.rcp': {
              name: 'cd.rcp',
              type: 'file' as 'file',
              parentPath: '/etc/chef',
              owner: 'root',
              permissions: 'rw-r--r--',
              content: `NAME
  cd - change directory

SYNOPSIS
  cd <directory>

DESCRIPTION
  Changes the current working directory to the specified directory.
  The current working directory is the directory in which you are currently operating.
  All relative paths are resolved from this directory.

OPTIONS
  None

EXAMPLES
  cd /etc              # Change to /etc directory
  cd ..                # Move up one directory
  cd ../..             # Move up two directories
  cd ~                 # Change to your home directory
  cd -                 # Change to the previous directory

PATH RESOLUTION
  - Absolute paths start with /
  - Relative paths are resolved from current directory
  - ~ expands to your home directory
  - .. refers to parent directory
  - . refers to current directory

PERMISSIONS
  Requires execute permission on the target directory.

ERRORS
  cd: directory: No such file or directory
    - The specified directory does not exist
  cd: directory: Not a directory
    - The specified path is not a directory
  cd: directory: Permission denied
    - You don't have execute permission for the directory

SEE ALSO
  pwd(1), ls(1)`,
              size: 0,
              createdAt: new Date(),
              modifiedAt: new Date(),
            },
            'pwd.rcp': {
              name: 'pwd.rcp',
              type: 'file' as 'file',
              parentPath: '/etc/chef',
              owner: 'root',
              permissions: 'rw-r--r--',
              content: `NAME
  pwd - print working directory

SYNOPSIS
  pwd

DESCRIPTION
  Prints the full path of the current working directory.
  The current working directory is the directory in which you are currently operating.
  All relative paths are resolved from this directory.

OPTIONS
  None

EXAMPLES
  pwd              # Print current working directory
  cd /etc && pwd   # Change to /etc and print its path

OUTPUT FORMAT
  The command outputs the absolute path of the current directory,
  starting with a forward slash (/).

ERRORS
  None - the command always succeeds if you have permission
  to access the current directory.

SEE ALSO
  cd(1), ls(1)`,
              size: 0,
              createdAt: new Date(),
              modifiedAt: new Date(),
            },
            'mkdir.rcp': {
              name: 'mkdir.rcp',
              type: 'file' as 'file',
              parentPath: '/etc/chef',
              owner: 'root',
              permissions: 'rw-r--r--',
              content: `NAME
  mkdir - make directories

SYNOPSIS
  mkdir <directory_name>

DESCRIPTION
  Creates a new directory with the specified name in the current working directory
  or at the specified path. The new directory will be owned by the user who created it
  and will have default permissions.

OPTIONS
  None

EXAMPLES
  mkdir newdir           # Create directory 'newdir' in current location
  mkdir /tmp/mydir       # Create directory 'mydir' in /tmp
  mkdir ~/projects      # Create directory 'projects' in your home directory

PERMISSIONS
  - Requires write permission in the parent directory
  - The new directory will be owned by the creating user
  - Default permissions are set to allow the owner full access

ERRORS
  mkdir: directory: File exists
    - A file or directory with that name already exists
  mkdir: directory: Permission denied
    - You don't have write permission in the parent directory
  mkdir: directory: No such file or directory
    - The parent directory doesn't exist

SEE ALSO
  ls(1), cd(1), touch(1)`,
              size: 0,
              createdAt: new Date(),
              modifiedAt: new Date(),
            },
            'touch.rcp': {
              name: 'touch.rcp',
              type: 'file' as 'file',
              parentPath: '/etc/chef',
              owner: 'root',
              permissions: 'rw-r--r--',
              content: `NAME
  touch - create empty file or update timestamp

SYNOPSIS
  touch <file_name>

DESCRIPTION
  Creates an empty file if it doesn't exist, or updates its timestamp if it does.
  The file will be owned by the user who created it and will have default permissions.
  If the file already exists, its access and modification times are updated to the current time.

OPTIONS
  None

EXAMPLES
  touch newfile.txt        # Create empty file 'newfile.txt'
  touch /tmp/test.txt      # Create empty file in /tmp directory
  touch ~/documents/note   # Create empty file in your documents directory

PERMISSIONS
  - Requires write permission in the parent directory
  - The new file will be owned by the creating user
  - Default permissions are set to allow the owner read and write access

ERRORS
  touch: file: Permission denied
    - You don't have write permission in the parent directory
  touch: file: No such file or directory
    - The parent directory doesn't exist

SEE ALSO
  ls(1), cat(1), mkdir(1)`,
              size: 0,
              createdAt: new Date(),
              modifiedAt: new Date(),
            },
            'cat.rcp': {
              name: 'cat.rcp',
              type: 'file' as 'file',
              parentPath: '/etc/chef',
              owner: 'root',
              permissions: 'rw-r--r--',
              content: `NAME
  cat - concatenate and print files

SYNOPSIS
  cat <file_name>

DESCRIPTION
  Reads the contents of a file and displays it on the terminal.
  The command is named 'cat' because it can concatenate multiple files,
  though in this implementation it reads one file at a time.
  The output is displayed exactly as it appears in the file, preserving
  whitespace and line breaks.

OPTIONS
  None

EXAMPLES
  cat myfile.txt           # Display contents of myfile.txt
  cat /etc/motd            # Display the message of the day
  cat ~/documents/note     # Display contents of a file in your documents

PERMISSIONS
  - Requires read permission on the target file
  - The file must be a regular file (not a directory)

ERRORS
  cat: file: No such file or directory
    - The specified file doesn't exist
  cat: file: Is a directory
    - The specified path is a directory
  cat: file: Permission denied
    - You don't have read permission for the file

SEE ALSO
  ls(1), touch(1), note(1)`,
              size: 0,
              createdAt: new Date(),
              modifiedAt: new Date(),
            },
            'noodl.rcp': { // Renamed from NoodlBrowse.rcp
              name: 'noodl.rcp',
              type: 'file' as 'file',
              parentPath: '/etc/chef',
              owner: 'root',
              permissions: 'rw-r--r--',
              content: "NAME\n  noodl - simple text-based web browser\n\nSYNOPSIS\n  noodl <url>\n\nDESCRIPTION\n  Fetches and displays a text-only version of the content at the given URL. Due to web security (CORS), this command uses an API proxy. It attempts to strip HTML, scripts, and styles to present readable text.\n  Interactive mode allows navigating by link number. Type 'q' to quit.",
              size: 0,
              createdAt: new Date(),
              modifiedAt: new Date(),
            },
            'chef.rcp': {
              name: 'chef.rcp',
              type: 'file' as 'file',
              parentPath: '/etc/chef',
              owner: 'root',
              permissions: 'rw-r--r--',
              content: "NAME\n  chef - display Noodlix manual pages (recipes)\n\nSYNOPSIS\n  chef <command_name>\n\nDESCRIPTION\n  The 'chef' command is your guide to what's cookin' in the Bashimi shell!\n  It displays the Noodlix manual page, called a 'recipe', for a given command.\n  Recipes provide helpful information about how to use a program, its options, and examples.\n\nHOW IT WORKS\n  When you run 'chef <command_name>', it looks for a recipe file named '<command_name>.rcp'\n  exclusively in the /etc/chef/ directory.\n\nCREATING YOUR OWN RECIPES\n  You can create recipes for your own scripts or programs.\n\n  1. File Format: Recipe files (.rcp) are plain text files. You can use any text editor,\n     like 'note', to create them.\n\n  2. Naming: The recipe file should have the same name as your script or command,\n     followed by the .rcp extension (e.g., myprogram.rcp for a command 'myprogram').\n\n  3. Placement: All recipe files, whether for system commands or custom programs,\n     must be placed in the /etc/chef/ directory.\n     Note: Adding or modifying files in /etc/chef/ typically requires root permissions.\n\n  4. Content Suggestions:\n     While the content is free-form, a common and helpful structure includes:\n     - NAME: The name of the command and a brief one-line description.\n     - SYNOPSIS: How to run the command, showing its arguments and options.\n     - DESCRIPTION: A more detailed explanation of what the command does.\n     - OPTIONS: A list of available command-line options and what they do.\n     - EXAMPLES: Practical examples of how to use the command.\n     - AUTHOR: (Optional) Who wrote the script/recipe.\n     - SEE ALSO: (Optional) Related commands or recipes.\n\nEXAMPLE of a simple my_script.rcp (to be placed in /etc/chef/):\n\n  NAME\n    my_script - a utility for doing cool things\n\n  SYNOPSIS\n    my_script [-v] <inputfile>\n\n  DESCRIPTION\n    This script processes the <inputfile> and performs a cool operation.\n    If -v is specified, it provides verbose output.\n\n  OPTIONS\n    -v   Enable verbose mode.\n\n  EXAMPLES\n    my_script data.txt\n    my_script -v important_stuff.dat",
              size: 0,
              createdAt: new Date(),
              modifiedAt: new Date(),
            },
            'note.rcp': {
              name: 'note.rcp',
              type: 'file' as 'file',
              parentPath: '/etc/chef',
              owner: 'root',
              permissions: 'rw-r--r--',
              content: "NAME\n  note - simple text editor\n\nSYNOPSIS\n  note <filename>\n\nDESCRIPTION\n  Opens a simple inline text editor for the specified file. If the file does not exist, it will be created upon saving.\n  Press Save to write changes, Exit Editor to close. Unsaved changes will be noted if you try to exit without saving.",
              size: 0,
              createdAt: new Date(),
              modifiedAt: new Date(),
            },
            'useradd.rcp': {
              name: 'useradd.rcp',
              type: 'file' as 'file',
              parentPath: '/etc/chef',
              owner: 'root',
              permissions: 'rw-r--r--',
              content: `NAME
  useradd - create a new user and their home directory

SYNOPSIS
  useradd <username> <password>

DESCRIPTION
  Creates a new user account with the specified username and password.
  This command is restricted to administrators only. When a new user is created:
  - A home directory is created at /home/<username>
  - A local configuration directory is created at /home/<username>/localcfg
  - An aliases file is created for the user
  - The user is assigned the 'user' role

OPTIONS
  None

EXAMPLES
  useradd john secretpass     # Create user 'john' with password 'secretpass'
  useradd alice mypassword    # Create user 'alice' with password 'mypassword'

USERNAME RULES
  - Must start with a lowercase letter or underscore
  - Can contain lowercase letters, numbers, underscores, and hyphens
  - Maximum length of 32 characters
  - Cannot be 'root' (reserved)

PERMISSIONS
  - Requires administrator privileges
  - Only root can create new users

ERRORS
  useradd: invalid username format
    - Username doesn't match the required format
  useradd: cannot recreate root user
    - Attempted to create a user named 'root'
  useradd: <username>: <error message>
    - Error from the authentication service
  useradd: created user '<username>' but failed to create home directory
    - User was created but home directory creation failed

SEE ALSO
  userdel(1), passwd(1)`,
              size: 0,
              createdAt: new Date(),
              modifiedAt: new Date(),
            },
            'userdel.rcp': {
              name: 'userdel.rcp',
              type: 'file' as 'file',
              parentPath: '/etc/chef',
              owner: 'root',
              permissions: 'rw-r--r--',
              content: `NAME
  userdel - delete a user account

SYNOPSIS
  userdel [-r] <username>

DESCRIPTION
  Deletes a user account from the system. This command is restricted to administrators only.
  By default, the user's home directory is preserved. Use the -r option to remove the
  home directory and all its contents.

OPTIONS
  -r    Remove the user's home directory and all its contents

EXAMPLES
  userdel john              # Delete user 'john', keep home directory
  userdel -r alice         # Delete user 'alice' and remove home directory

PERMISSIONS
  - Requires administrator privileges
  - Only root can delete users
  - Cannot delete the root user

ERRORS
  userdel: user '<username>' does not exist
    - The specified user doesn't exist
  userdel: cannot delete root user
    - Attempted to delete the root user
  userdel: failed to delete user '<username>'
    - Error from the authentication service
  User '<username>' deleted, but failed to remove home directory
    - User was deleted but home directory removal failed

SEE ALSO
  useradd(1), passwd(1)`,
              size: 0,
              createdAt: new Date(),
              modifiedAt: new Date(),
            },
            'passwd.rcp': {
              name: 'passwd.rcp',
              type: 'file' as 'file',
              parentPath: '/etc/chef',
              owner: 'root',
              permissions: 'rw-r--r--',
              content: `NAME
  passwd - change user password

SYNOPSIS
  passwd [username] <newpassword>

DESCRIPTION
  Changes the password for a user account. If no username is specified,
  changes the password for the current user. Administrators can change
  any user's password by specifying the username.

OPTIONS
  None

EXAMPLES
  passwd newpass           # Change current user's password
  passwd john newpass     # Change john's password (admin only)

PERMISSIONS
  - Users can change their own password
  - Administrators can change any user's password
  - Non-administrators cannot change other users' passwords

ERRORS
  passwd: Only admin can change other users' passwords
    - Non-admin user attempted to change another user's password
  passwd: password cannot be empty
    - Attempted to set an empty password
  passwd: failed to update password for '<username>'
    - Error from the authentication service or user doesn't exist

SEE ALSO
  useradd(1), userdel(1)`,
              size: 0,
              createdAt: new Date(),
              modifiedAt: new Date(),
            }
          }
        }
      }
    },
    bin: {
        name: 'bin',
        type: 'dir' as 'dir',
        parentPath: '/',
        owner: 'root',
        permissions: 'rwxr-xr-x',
        createdAt: new Date(),
        modifiedAt: new Date(),
        children: {}
    }
  },
};
    
