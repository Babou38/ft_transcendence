import { AuthService } from "../auth/AuthService";

const API_URL = import.meta.env.VITE_API_URL || 'https://localhost:8443';

export interface DashboardStats
{
  user: {
    id: number;
    username: string;
    wins: number;
    losses: number;
    totalGames: number;
    winRate: number;
  };
  ranking: {
    position: number;
    totalPlayers: number;
  };
  recentGames: GameResult[];
  winStreak: {
    current: number;
    best: number;
  };
  gamesByType: {
    pong: { wins: number; losses: number; };
    pacman: { wins: number; losses: number; };
  };
}

export interface GameResult
{
  id: number;
  opponent?: string;
  score: string;
  result: 'win' | 'loss';
  gameType: 'pong' | 'pacman';
  date: string;
}

export class DashboardAPI
{
  
  static async loadDashboard(userId: number): Promise<DashboardStats>
  {
    const token = AuthService.getToken();
    if (!token)
      throw new Error('Not authenticated');
    
    const response = await fetch(`${API_URL}/api/users/${userId}/dashboard`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok)
      throw new Error('Failed to load dashboard');
    
    return await response.json();
  }
  
  static async loadRecentGames(userId: number, limit: number = 10): Promise<GameResult[]>
  {
    const token = AuthService.getToken();
    if (!token)
      throw new Error('Not authenticated');
    
    const response = await fetch(`${API_URL}/api/users/${userId}/games?limit=${limit}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok)
      throw new Error('Failed to load recent games');
    
    return await response.json();
  }
}