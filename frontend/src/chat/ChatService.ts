const API_URL = import.meta.env.VITE_API_URL || '';
import { AuthService } from '../auth/AuthService';

export interface Message {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  createdAt: string;
  senderUsername?: string;
}

export interface Conversation {
  otherUserId: number;
  username: string;
  avatar: string;
  lastMessage: string;
  lastMessageAt: string;
}

export class ChatService {
  private static getAuthHeaders(): HeadersInit {
    const token = AuthService.getToken();
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  }

  static async sendMessage(receiverId: number, content: string): Promise<Message> {
    const response = await fetch(`${API_URL}/api/chat/messages`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ receiverId, content })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to send message');
    }

    return response.json();
  }

  static async getConversation(userId: number): Promise<Message[]> {
    const response = await fetch(`${API_URL}/api/chat/conversations/${userId}`, {
      headers: this.getAuthHeaders(),
      credentials: 'include'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to load conversation');
    }

    return response.json();
  }

  static async getConversations(): Promise<Conversation[]> {
    const response = await fetch(`${API_URL}/api/chat/conversations`, {
      headers: this.getAuthHeaders(),
      credentials: 'include'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to load conversations');
    }

    return response.json();
  }

  static async blockUser(userId: number): Promise<void> {
    const token = AuthService.getToken();
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${API_URL}/api/chat/block/${userId}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({}),
      credentials: 'include'
    });

    if (!response.ok) {
      let errMsg = 'Failed to block user';
      try {
        const data = await response.json();
        errMsg = data.error || data.message || errMsg;
      } catch (_) {}
      throw new Error(errMsg);
    }
  }

  static async unblockUser(userId: number): Promise<void> {
    const response = await fetch(`${API_URL}/api/chat/block/${userId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
      credentials: 'include'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to unblock user');
    }
  }

  static async getBlockedUsers(): Promise<any[]> {
    const response = await fetch(`${API_URL}/api/chat/blocked`, {
      headers: this.getAuthHeaders(),
      credentials: 'include'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to load blocked users');
    }

    return response.json();
  }
}