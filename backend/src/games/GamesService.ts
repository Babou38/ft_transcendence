import { db } from '../database/db.js';

export interface GameRecord {
  player_id: number;
  opponent_username?: string;
  game_type: 'pong' | 'pacman';
  player_score: number;
  opponent_score: number;
  result: 'win' | 'loss';
  duration_seconds?: number;
}

export function recordGame(game: GameRecord): void {
  const stmt = db.prepare(`
    INSERT INTO games (player_id, opponent_username, game_type, player_score, opponent_score, result, duration_seconds)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(
    game.player_id,
    game.opponent_username || null,
    game.game_type,
    game.player_score,
    game.opponent_score,
    game.result,
    game.duration_seconds || null
  );
  
  const updateStmt = db.prepare(`
    UPDATE users
    SET ${game.result === 'win' ? 'wins = wins + 1' : 'losses = losses + 1'}
    WHERE id = ?
  `);
  
  updateStmt.run(game.player_id);
}

export function getRecentGames(userId: number, limit: number = 10) {
  const stmt = db.prepare(`
    SELECT 
      id,
      opponent_username,
      game_type,
      player_score,
      opponent_score,
      result,
      played_at
    FROM games
    WHERE player_id = ?
    ORDER BY played_at DESC
    LIMIT ?
  `);
  
  const games = stmt.all(userId, limit) as any[];
  
  return games.map(g => ({
    id: g.id,
    opponent: g.opponent_username || 'AI',
    score: `${g.player_score} - ${g.opponent_score}`,
    result: g.result,
    gameType: g.game_type,
    date: g.played_at
  }));
}

export function getGamesByType(userId: number) {
  const stmt = db.prepare(`
    SELECT 
      game_type,
      SUM(CASE WHEN result = 'win' THEN 1 ELSE 0 END) as wins,
      SUM(CASE WHEN result = 'loss' THEN 1 ELSE 0 END) as losses
    FROM games
    WHERE player_id = ?
    GROUP BY game_type
  `);
  
  const results = stmt.all(userId) as any[];
  
  const stats = {
    pong: { wins: 0, losses: 0 },
    pacman: { wins: 0, losses: 0 }
  };
  
  results.forEach(r => {
    if (r.game_type === 'pong') {
      stats.pong = { wins: r.wins, losses: r.losses };
    } else if (r.game_type === 'pacman') {
      stats.pacman = { wins: r.wins, losses: r.losses };
    }
  });
  
  return stats;
}

export function getCurrentStreak(userId: number): { current: number; best: number } {
  const stmt = db.prepare(`
    SELECT result
    FROM games
    WHERE player_id = ?
    ORDER BY played_at DESC
  `);
  
  const games = stmt.all(userId) as any[];
  
  if (games.length === 0) {
    return { current: 0, best: 0 };
  }
  
  let current = 0;
  for (const game of games) {
    if (game.result === 'win') {
      current++;
    } else {
      break;
    }
  }
  
  let best = 0;
  let temp = 0;
  
  for (const game of games.reverse()) {
    if (game.result === 'win') {
      temp++;
      best = Math.max(best, temp);
    } else {
      temp = 0;
    }
  }
  
  return { current, best };
}

export function getUserRanking(userId: number): { position: number; totalPlayers: number }
{
  const countStmt = db.prepare('SELECT COUNT(*) as total FROM users');
  const { total } = countStmt.get() as any;
  
  const rankStmt = db.prepare(`
    SELECT COUNT(*) + 1 as position
    FROM users
    WHERE wins > (SELECT wins FROM users WHERE id = ?)
  `);
  
  const { position } = rankStmt.get(userId) as any;
  
  return {
    position: position || 1,
    totalPlayers: total || 1
  };
}