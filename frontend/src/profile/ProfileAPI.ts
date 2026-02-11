import { AuthService } from "../auth/AuthService";

const API_URL = import.meta.env.VITE_API_URL || 'https://localhost:8443';

export interface User
{
  id: number;
  username: string;
  email: string;
  avatar: string;
  wins: number;
  losses: number;
}

export interface Friend
{
  id: number;
  username: string;
  avatar: string;
  wins: number;
  losses: number;
  isOnline?: boolean;
}

export class ProfileAPI
{
  
  static async loadFriends(userId: number): Promise<Friend[]>
  {
    const token = AuthService.getToken();
    if (!token)
      throw new Error('Not authenticated');
    
    const response = await fetch(`${API_URL}/api/users/${userId}/friends`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok)
      throw new Error('Failed to load friends');
    
    return await response.json();
  }

  static async loadOnlineFriends(userId: number): Promise<number[]>
{
  const token = AuthService.getToken();
  if (!token)
    throw new Error('Not authenticated');
  
  const response = await fetch(`${API_URL}/api/users/${userId}/friends/online`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok)
    throw new Error('Failed to load online friends');
  
  const data = await response.json();
  return data.map((friend: any) => friend.id);
}
  
  static async loadAllUsers(): Promise<User[]>
  {
    const token = AuthService.getToken();
    if (!token)
      throw new Error('Not authenticated');
    
    const response = await fetch(`${API_URL}/api/users`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok)
      throw new Error('Failed to load users');
    
    return await response.json();
  }
  
  static async addFriend(userId: number, friendId: number): Promise<void>
  {
    const token = AuthService.getToken();
    if (!token)
      throw new Error('Not authenticated');
    
    const response = await fetch(`${API_URL}/api/users/${userId}/friends`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ friendId })
    });
    
    if (!response.ok)
    {
      const error = await response.json();
      throw new Error(error.error || 'Failed to add friend');
    }
  }
  
  static async removeFriend(userId: number, friendId: number): Promise<void>
  {
    const token = AuthService.getToken();
    if (!token)
      throw new Error('Not authenticated');
    
    const response = await fetch(`${API_URL}/api/users/${userId}/friends/${friendId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok)
    {
      const error = await response.json();
      throw new Error(error.error || 'Failed to remove friend');
    }
  }
  
  static async uploadAvatar(userId: number, file: File): Promise<string>
  {
    const token = AuthService.getToken();
    if (!token)
      throw new Error('Not authenticated');
    
    if (file.size > 5 * 1024 * 1024)
      throw new Error('File too large! Max 5MB');
    
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${API_URL}/api/users/${userId}/avatar`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    if (!response.ok)
    {
      const error = await response.json();
      throw new Error(error.error || 'Upload failed');
    }
    
    const data = await response.json();
    return data.avatar;
  }

  static getAvatarUrl(filename: string): string {
    if (!filename || filename === 'default-avatar.png')
      return '';
    return `/uploads/avatars/${filename}`;
  }

  static async updateProfile(userId: number, updates: { username?: string; email?: string }): Promise<User>
  {
    const token = AuthService.getToken();
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
      throw new Error(error.error || 'Failed to update profile');
    }
    
    return await response.json();
  }
}

export async function loadUserProfile(userId?: number): Promise<User> {
  const token = AuthService.getToken();
  if (!token) throw new Error('Not authenticated');

  const url = userId ? `${API_URL}/api/users/${userId}` : `${API_URL}/api/users/me`;
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || err.message || 'Failed to load user');
  }

  return response.json();
}