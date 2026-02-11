const API_URL = import.meta.env.VITE_API_URL || 'https://localhost:8443';

interface User
{
  id: number;
  username: string;
  email: string;
  avatar: string;
  wins: number;
  losses: number;
}

interface LoginResponse
{
  user: User;
  token: string;
}

interface RegisterResponse
{
  id: number;
  username: string;
  email: string;
  avatar: string;
}

export class AuthService
{
  private static token: string | null = null;
  private static currentUser: User | null = null;

  static async register(email: string, username: string, password: string): Promise<User>
  {
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, username, password })
    });

    if (!response.ok)
    {
      const error = await response.json();
      throw new Error(error.error || 'Registration failed');
    }

    const data: RegisterResponse = await response.json();
    
    return await this.login(email, password);
  }

  static async login(email: string, password: string): Promise<User>
  {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok)
    {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    const data: LoginResponse = await response.json();
    
    this.token = data.token;
    this.currentUser = data.user;
    
    sessionStorage.setItem('auth_token', data.token);
    sessionStorage.setItem('current_user', JSON.stringify(data.user));
    
    return data.user;
  }

  static async logout(): Promise<void>
  {
    if (!this.token)
      return;

    try
    {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
        }
      });
    }
    catch (error)
    {
      console.error('Logout error:', error);
    }
    finally
    {
      this.token = null;
      this.currentUser = null;
      sessionStorage.removeItem('auth_token');
      sessionStorage.removeItem('current_user');
    }
  }

  static isAuthenticated(): boolean
  {
    if (this.token && this.currentUser)
      return true;

    const token = sessionStorage.getItem('auth_token');
    const userStr = sessionStorage.getItem('current_user');
    
    if (token && userStr)
    {
      this.token = token;
      this.currentUser = JSON.parse(userStr);
      return true;
    }

    return false;
  }

  static getCurrentUser(): User | null
  {
    if (this.currentUser)
      return this.currentUser;

    const userStr = sessionStorage.getItem('current_user');
    if (userStr)
    {
      this.currentUser = JSON.parse(userStr);
      return this.currentUser;
    }

    return null;
  }

  static async verifyCredentials(email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }>
  {
    try
    {
      const response = await fetch(`${API_URL}/api/auth/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok)
      {
        const error = await response.json();
        return { success: false, error: error.error || 'Invalid credentials' };
      }

      const data: { user: User } = await response.json();
      
      return { success: true, user: data.user };
    }
    catch (error)
    {
      return { success: false, error: 'Connection error' };
    }
  }

  static getToken(): string | null
  {
    if (this.token)
      return this.token;

    this.token = sessionStorage.getItem('auth_token');
    return this.token;
  }

  static async fetchCurrentUser(): Promise<User>
  {
    const token = this.getToken();
    
    if (!token)
      throw new Error('Not authenticated');

    const response = await fetch(`${API_URL}/api/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok)
      throw new Error('Failed to fetch user data');

    const user: User = await response.json();
    this.currentUser = user;
    sessionStorage.setItem('current_user', JSON.stringify(user));
    
    return user;
  }

  static async updateProfile(userId: number, updates: { username?: string; email?: string }): Promise<User>
  {
    const token = this.getToken();
    
    if (!token)
      throw new Error('Not authenticated');

    const response = await fetch(`${API_URL}/api/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updates)
    });

    if (!response.ok)
    {
      const error = await response.json();
      throw new Error(error.error || 'Update failed');
    }

    const user: User = await response.json();
    this.currentUser = user;
    sessionStorage.setItem('current_user', JSON.stringify(user));
    
    return user;
  }
}