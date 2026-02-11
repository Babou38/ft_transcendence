import { MultipartFile } from '@fastify/multipart';
import { randomBytes } from 'crypto';
import { writeFileSync } from 'fs';
import path from 'path';
import sharp from 'sharp';
import { db } from '../database/db.js';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg'];
const MAX_SIZE = 5 * 1024 * 1024;

export async function uploadAvatar(userId: number, file: MultipartFile): Promise<string> {
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
        throw new Error('Type de fichier non autorisé. Utilisez JPG ou PNG.');
    }
    
    const buffer = await file.toBuffer();

    if (buffer.length > MAX_SIZE) {
        throw new Error('Fichier trop volumineux. Maximum 5MB.');
    }
    
    try {
        const metadata = await sharp(buffer).metadata();
        
        if (!['jpeg', 'png', 'jpg'].includes(metadata.format || '')) {
            throw new Error('Format d\'image non valide.');
        }
    } catch (error) {
        throw new Error('Le fichier n\'est pas une image valide.');
    }
    
    const extension = file.mimetype.split('/')[1];
    const filename = `${userId}-${randomBytes(8).toString('hex')}.${extension}`;
    
    const uploadDir = path.join(process.cwd(), 'uploads', 'avatars');
    const filepath = path.join(uploadDir, filename);

    writeFileSync(filepath, buffer);
    const stmt = db.prepare('UPDATE users SET avatar = ? WHERE id = ?');
    stmt.run(filename, userId);
    
    return filename;
}

export function getAvatarUrl(filename: string): string {
    return `/uploads/avatars/${filename}`;
}