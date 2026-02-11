import { FastifyInstance } from 'fastify';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { sendMessage, getConversation, getRecentConversations } from './ChatService.js';
import { blockUser, unblockUser, getBlockedUsers } from './BlockService.js';
import { ValidationService } from '../ValidationService.js';

export default async function chatRoutes(fastify: FastifyInstance) {

    fastify.post('/messages', { preHandler: authMiddleware }, async (request, reply) => {
        try {
            const { receiverId, content } = request.body as { receiverId: number; content: string };
            const senderId = request.userId!;

            if (!receiverId || !content?.trim()) {
                return reply.code(400).send({ error: 'receiverId et content requis' });
            }

            const validReceiverId = ValidationService.validateId(receiverId);
            const cleanContent = ValidationService.validateText(content.trim(), 1000); // Max 1000 caractères

            const message = sendMessage(senderId, validReceiverId, cleanContent);
            return reply.code(201).send(message);

        } catch (error: any) {
            return reply.code(400).send({ error: error.message });
        }
    });

    fastify.get('/conversations/:userId', { preHandler: authMiddleware }, async (request, reply) => {
        try {
            const { userId } = request.params as { userId: string };
            const currentUserId = request.userId!;

            const otherUserId = ValidationService.validateId(userId);

            const messages = getConversation(currentUserId, otherUserId);
            return reply.code(200).send(messages);

        } catch (error: any) {
            return reply.code(500).send({ error: error.message });
        }
    });

    fastify.get('/conversations', { preHandler: authMiddleware }, async (request, reply) => {
        try {
            const userId = request.userId!;
            const conversations = getRecentConversations(userId);
            return reply.code(200).send(conversations);

        } catch (error: any) {
            return reply.code(500).send({ error: error.message });
        }
    });

    fastify.post('/block/:userId', { preHandler: authMiddleware }, async (request, reply) => {
        try {
            const { userId } = request.params as { userId: string };
            const currentUserId = request.userId!;

            const blockedUserId = ValidationService.validateId(userId);

            blockUser(currentUserId, blockedUserId);
            return reply.code(200).send({ success: true, message: 'Utilisateur bloqué' });

        } catch (error: any) {
            return reply.code(400).send({ error: error.message });
        }
    });

    fastify.delete('/block/:userId', { preHandler: authMiddleware }, async (request, reply) => {
        try {
            const { userId } = request.params as { userId: string };
            const currentUserId = request.userId!;

            const blockedUserId = ValidationService.validateId(userId);

            unblockUser(currentUserId, blockedUserId);
            return reply.code(200).send({ success: true, message: 'Utilisateur débloqué' });

        } catch (error: any) {
            return reply.code(500).send({ error: error.message });
        }
    });

    fastify.get('/blocked', { preHandler: authMiddleware }, async (request, reply) => {
        try {
            const userId = request.userId!;
            const blocked = getBlockedUsers(userId);
            return reply.code(200).send(blocked);

        } catch (error: any) {
            return reply.code(500).send({ error: error.message });
        }
    });
}
