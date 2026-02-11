import { db } from '../database/db.js';

interface User {
    id: number;
    username: string;
    email: string;
    avatar: string;
    wins: number;
    losses: number;
    created_at: string;
}

export function getUserById(userId: number): User {
    const stmt = db.prepare(`
        SELECT id, username, email, avatar, wins, losses, created_at
        FROM users
        WHERE id = ?
    `);
    
    const user = stmt.get(userId) as User;
    
    if (!user) {
        throw new Error('Utilisateur non trouvé');
    }
    
    return user;
}

export function updateUser(userId: number, updates: { username?: string; email?: string }): User {
    const fields: string[] = [];
    const values: any[] = [];
    
    if (updates.username !== undefined) {
        fields.push('username = ?');
        values.push(updates.username);
    }
    
    if (updates.email !== undefined) {
        fields.push('email = ?');
        values.push(updates.email);
    }
    
    if (fields.length === 0) {
        throw new Error('Aucune modification fournie');
    }
    
    values.push(userId);
    
    const query = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
    const stmt = db.prepare(query);
    
    try {
        stmt.run(...values);
        return getUserById(userId);
    } catch (error: any) {
        if (error.message.includes('UNIQUE')) {
            throw new Error('Username ou email déjà utilisé');
        }
        throw error;
    }
}

export function getUserStats(userId: number) {
    const user = getUserById(userId);
    
    return {
        userId: user.id,
        username: user.username,
        wins: user.wins,
        losses: user.losses,
        totalGames: user.wins + user.losses,
        winRate: user.wins + user.losses > 0 
            ? ((user.wins / (user.wins + user.losses)) * 100).toFixed(2) + '%'
            : '0%'
    };
}

export function getOnlineFriends(userId: number) {
    const stmt = db.prepare(`
        SELECT u.id, u.username, u.avatar
        FROM friends f
        JOIN users u ON f.friend_id = u.id
        JOIN sessions s ON s.user_id = u.id
        WHERE f.user_id = ? 
          AND s.expires_at > datetime('now')
        GROUP BY u.id
    `);
    return stmt.all(userId);
}