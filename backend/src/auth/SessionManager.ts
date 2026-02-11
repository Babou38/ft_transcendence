import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const SECRET_KEY = process.env.JWT_SECRET!;

if (!SECRET_KEY) {
    throw new Error('JWT_SECRET non défini dans .env');
}

export function generateToken(userId: number): string {
    const payload = { id: userId };
    const token = jwt.sign(payload, SECRET_KEY, { expiresIn: '10h' });
    return token;
}

export interface TokenPayload {
    id: number;
    iat?: number;
    exp?: number;
}

export function verifyToken(token: string): TokenPayload | null {
    try {
        const decoded = jwt.verify(token, SECRET_KEY) as TokenPayload;
        return decoded;

    } catch (error) {
        return null;
    }
}