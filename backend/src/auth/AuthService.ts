import { db } from '../database/db.js';
import { hashPassword, verifyPassword } from './PasswordUtils.js';
import { generateToken } from './SessionManager.js';

export async function registerUser(email: string, username: string, password: string) {

    const checkStmt = db.prepare('SELECT id FROM users WHERE email = ? OR username = ?');
    const existing = checkStmt.get(email, username);

    if (existing) {
        throw new Error('Email ou Username déjà pris.');
    }

    const hashedPassword = await hashPassword(password);

    const insertStmt = db.prepare('INSERT INTO users (email, username, password) VALUES (?, ?, ?)');
    insertStmt.run(email, username, hashedPassword);

    const getNewUserStmt = db.prepare('SELECT id, email, username, avatar FROM users WHERE email = ?');
    return getNewUserStmt.get(email);
}

export async function loginUser(email: string, passwordInput: string) {
    
    const getUserStmt = db.prepare('SELECT * FROM users WHERE email = ?');
    const user: any = getUserStmt.get(email);

    if (!user) {
        throw new Error('Email ou mot de passe incorrect.');
    }

    const isPasswordValid = await verifyPassword(passwordInput, user.password);

    if (!isPasswordValid) {
        throw new Error('Email ou mot de passe incorrect.');
    }

    const token = generateToken(user.id);

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 10);

    const insertSessionStmt = db.prepare('INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, ?)');
    insertSessionStmt.run(user.id, token, expiresAt.toISOString());

    return {
        user: {
            id: user.id,
            username: user.username,
            email: user.email,
            avatar: user.avatar,
            wins: user.wins,
            losses: user.losses
        },
        token: token
    };
}
