import { db } from '../database/db.js';
import { isBlocked } from './BlockService.js';

export function sendMessage(senderId: number, receiverId: number, content: string) {
    if (isBlocked(receiverId, senderId)) {
        throw new Error('Vous êtes bloqué par cet utilisateur');
    }

    if (isBlocked(senderId, receiverId)) {
        throw new Error('Vous avez bloqué cet utilisateur');
    }

    const insertStmt = db.prepare(
        'INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)'
    );
    const result = insertStmt.run(senderId, receiverId, content);

    return {
        id: result.lastInsertRowid,
        senderId,
        receiverId,
        content,
        createdAt: new Date().toISOString()
    };
}

export function getConversation(user1Id: number, user2Id: number, limit: number = 50) {
    const stmt = db.prepare(`
        SELECT 
            m.id,
            m.sender_id as senderId,
            m.receiver_id as receiverId,
            m.content,
            m.created_at as createdAt,
            u.username as senderUsername
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE (m.sender_id = ? AND m.receiver_id = ?)
           OR (m.sender_id = ? AND m.receiver_id = ?)
        ORDER BY m.created_at DESC
        LIMIT ?
    `);
    return stmt.all(user1Id, user2Id, user2Id, user1Id, limit).reverse();
}

export function getRecentConversations(userId: number) {
    const stmt = db.prepare(`
        SELECT 
            u.id as otherUserId,
            u.username,
            u.avatar,
            m.content as lastMessage,
            m.created_at as lastMessageAt
        FROM messages m
        JOIN users u ON (
            (m.sender_id = ? AND m.receiver_id = u.id) OR 
            (m.receiver_id = ? AND m.sender_id = u.id)
        )
        WHERE m.id IN (
            SELECT MAX(id)
            FROM messages
            WHERE sender_id = ? OR receiver_id = ?
            GROUP BY 
                CASE 
                    WHEN sender_id = ? THEN receiver_id 
                    ELSE sender_id 
                END
        )
        ORDER BY m.created_at DESC
    `);
    return stmt.all(userId, userId, userId, userId, userId);
}