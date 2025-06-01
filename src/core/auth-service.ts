import type { User } from '@/types';
import { DEFAULT_USERS, DEFAULT_ROOT_PASSWORD } from '@/config';

const SESSION_KEY = 'noodlix_user_session';
const USERS_DB_KEY = 'noodlix_users';

export class AuthService {
  private users: User[];
  private isClient: boolean;

  constructor() {
    this.isClient = typeof window !== 'undefined';

    if (this.isClient) {
      const storedUsers = localStorage.getItem(USERS_DB_KEY);
      if (storedUsers) {
        this.users = JSON.parse(storedUsers);
      } else {
        // Ensure default users have passwords if not set in config (though they should be)
        this.users = DEFAULT_USERS.map(u => ({
          ...u,
          password: u.password || (u.username === 'root' ? DEFAULT_ROOT_PASSWORD : undefined)
        }));
        this.saveUsersToStorage();
      }
    } else {
      this.users = DEFAULT_USERS.map(u => ({
        ...u,
        password: u.password || (u.username === 'root' ? DEFAULT_ROOT_PASSWORD : undefined)
      }));
    }
  }

  private saveUsersToStorage(): void {
    if (this.isClient) {
      localStorage.setItem(USERS_DB_KEY, JSON.stringify(this.users));
    }
  }

  async login(username: string, password_plaintext: string): Promise<User | null> {
    const user = this.users.find(u => u.username === username);
    if (!user) {
      return null;
    }

    // Plaintext password check. DO NOT USE IN PRODUCTION.
    if (user.password === password_plaintext) {
      const sessionUser = { ...user, lastLogin: new Date() };
      if (this.isClient) {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
      }
      return sessionUser;
    }
    return null;
  }

  logout(): void {
    if (this.isClient) {
      sessionStorage.removeItem(SESSION_KEY);
    }
  }

  getCurrentUser(): User | null {
    if (this.isClient) {
      const sessionData = sessionStorage.getItem(SESSION_KEY);
      if (sessionData) {
        return JSON.parse(sessionData) as User;
      }
    }
    return null;
  }

  getUser(username: string): User | undefined {
    return this.users.find(u => u.username === username);
  }

  addUser(username: string, password_plaintext: string, role: 'admin' | 'user' = 'user', homeDirectory: string): User | string {
    if (this.users.find(u => u.username === username)) {
      return `User ${username} already exists.`;
    }
    const newUser: User = {
      username,
      password: password_plaintext,
      role,
      homeDirectory,
    };
    this.users.push(newUser);
    this.saveUsersToStorage();
    return newUser;
  }

  deleteUser(username: string): boolean {
    const index = this.users.findIndex(u => u.username === username);
    if (index === -1) return false;
    this.users.splice(index, 1);
    this.saveUsersToStorage();
    return true;
  }

  updateUserPassword(username: string, newPassword_plaintext: string): boolean {
    const user = this.users.find(u => u.username === username);
    if (!user) {
      return false; // User not found
    }
    user.password = newPassword_plaintext;
    this.saveUsersToStorage();
    return true;
  }
}
