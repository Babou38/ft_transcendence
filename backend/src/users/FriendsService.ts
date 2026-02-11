import { db } from '../database/db.js';
import { getUserById } from './UserService.js';
export function addFriend(userId: number, friendId: number): void {
    getUserById(friendId)
    
    if (userId === friendId) {
        throw new Error('Vous ne pouvez pas vous ajouter vous-même');
    }
    
    const checkStmt = db.prepare(
        'SELECT id FROM friends WHERE user_id = ? AND friend_id = ?'
    );
    const existing = checkStmt.get(userId, friendId);
    
    if (existing) {
        throw new Error('Déjà ami avec cet utilisateur');
    }
    const insertStmt = db.prepare(
        'INSERT INTO friends (user_id, friend_id) VALUES (?, ?)'
    );
    
    insertStmt.run(userId, friendId);
    insertStmt.run(friendId, userId);
}

export function removeFriend(userId: number, friendId: number): void {
    const deleteStmt = db.prepare(
        'DELETE FROM friends WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)'
    );
    
    deleteStmt.run(userId, friendId, friendId, userId);
}

export function getFriends(userId: number) {
    const stmt = db.prepare(`
        SELECT u.id, u.username, u.avatar, u.wins, u.losses
        FROM friends f
        JOIN users u ON f.friend_id = u.id
        WHERE f.user_id = ?
        ORDER BY u.username ASC
    `);
    
    return stmt.all(userId);
}

export function areFriends(userId: number, friendId: number): boolean {
    const stmt = db.prepare(
        'SELECT id FROM friends WHERE user_id = ? AND friend_id = ?'
    );
    
    return !!stmt.get(userId, friendId);
}