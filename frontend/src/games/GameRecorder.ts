import { AuthService } from "../auth/AuthService";

const API_URL = import.meta.env.VITE_API_URL || 'https://localhost:8443';

export interface GameResult {
  game_type: 'pong' | 'pacman';
  player_score: number;
  opponent_score: number;
  result: 'win' | 'loss';
  opponent_username?: string;
  duration_seconds?: number;
}

export class GameRecorder {
  
  static async recordGame(game: GameResult): Promise<void> {
    const token = AuthService.getToken();
    if (!token) {
      console.warn('Not authenticated, game not recorded');
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/api/games`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(game)
      });
      
      if (response.ok) {
        console.log('Game recorded successfully');
      } else {
        console.error('Failed to record game:', await response.text());
      }
      
    } catch (error) {
      console.error('Error recording game:', error);
    }
  }
}