import { FastifyRequest, FastifyReply } from 'fastify';
import { verifyToken } from '../auth/SessionManager.js';
import { db } from '../database/db.js';

declare module 'fastify' {
  interface FastifyRequest {
    userId?: number;
  }
}

export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const authHeader = request.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.code(401).send({ error: 'Token manquant' });
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    
    if (!payload) {
      return reply.code(401).send({ error: 'Token invalide' });
    }

    const sessionStmt = db.prepare(
      'SELECT user_id, expires_at FROM sessions WHERE token = ?'
    );
    const session: any = sessionStmt.get(token);

    if (!session) {
      return reply.code(401).send({ error: 'Session expirée' });
    }

    const expiresAt = new Date(session.expires_at);
    if (expiresAt < new Date()) {
      return reply.code(401).send({ error: 'Session expirée' });
    }

    request.userId = session.user_id;
  } catch (error) {
    return reply.code(500).send({ error: 'Erreur serveur' });
  }
}