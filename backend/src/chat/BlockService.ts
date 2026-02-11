import { db } from '../database/db.js';

export function blockUser(userId: number, blockedUserId: number): void {
    if (userId === blockedUserId) {
        throw new Error('Impossible de se bloquer soi-même');
    }

    const checkStmt = db.prepare(
        'SELECT id FROM blocked_users WHERE user_id = ? AND blocked_user_id = ?'
    );
    const existing = checkStmt.get(userId, blockedUserId);

    if (existing) {
        throw new Error('Utilisateur déjà bloqué');
    }

    const insertStmt = db.prepare(
        'INSERT INTO blocked_users (user_id, blocked_user_id) VALUES (?, ?)'
    );
    insertStmt.run(userId, blockedUserId);
}

export function unblockUser(userId: number, blockedUserId: number): void {
    const deleteStmt = db.prepare(
        'DELETE FROM blocked_users WHERE user_id = ? AND blocked_user_id = ?'
    );
    deleteStmt.run(userId, blockedUserId);
}

export function getBlockedUsers(userId: number) {
    const stmt = db.prepare(`
        SELECT u.id, u.username, u.avatar
        FROM blocked_users b
        JOIN users u ON b.blocked_user_id = u.id
        WHERE b.user_id = ?
        ORDER BY u.username ASC
    `);
    return stmt.all(userId);
}

export function isBlocked(userId: number, targetUserId: number): boolean {
    const stmt = db.prepare(
        'SELECT id FROM blocked_users WHERE user_id = ? AND blocked_user_id = ?'
    );
    return !!stmt.get(userId, targetUserId);
}