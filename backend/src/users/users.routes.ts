import { FastifyInstance } from 'fastify';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { getUserById, updateUser, getUserStats, getOnlineFriends } from './UserService.js';
import { addFriend, removeFriend, getFriends } from './FriendsService.js';
import { uploadAvatar, getAvatarUrl } from './AvatarService.js';
import { db } from '../database/db.js';
import { getRecentGames, getGamesByType, getCurrentStreak, getUserRanking } from '../games/GamesService.js';
import { ValidationService } from '../ValidationService.js';

export default async function usersRoutes(fastify: FastifyInstance) {

    fastify.get('/', { preHandler: authMiddleware }, async (request, reply) => {
        try {
            const stmt = db.prepare(`
                SELECT id, username, email, avatar, wins, losses
                FROM users
                ORDER BY username ASC
            `);
            
            const users = stmt.all();
            return reply.code(200).send(users);
            
        } catch (error: any) {
            return reply.code(500).send({ error: error.message });
        }
    });

    fastify.get('/:id', async (request, reply) => {
        try {
            const { id } = request.params as { id: string };
            
            const userId = ValidationService.validateId(id);
            
            const user = getUserById(userId);
            return reply.code(200).send(user);
            
        } catch (error: any) {
            return reply.code(404).send({ error: error.message });
        }
    });

    fastify.get('/:id/dashboard', { preHandler: authMiddleware }, async (request, reply) => {
        try {
            const { id } = request.params as { id: string };
            
            const userId = ValidationService.validateId(id);
            
            const user = getUserById(userId);
            
            const totalGames = user.wins + user.losses;
            const winRate = totalGames > 0 ? (user.wins / totalGames) * 100 : 0;
            
            const recentGames = getRecentGames(userId, 10);
            const gamesByType = getGamesByType(userId);
            const winStreak = getCurrentStreak(userId);
            const ranking = getUserRanking(userId);
            
            const dashboard = {
                user: {
                    id: user.id,
                    username: user.username,
                    wins: user.wins,
                    losses: user.losses,
                    totalGames: totalGames,
                    winRate: winRate
                },
                ranking: ranking,
                recentGames: recentGames,
                winStreak: winStreak,
                gamesByType: gamesByType
            };
            
            return reply.code(200).send(dashboard);
            
        } catch (error: any) {
            return reply.code(404).send({ error: error.message });
        }
    });
    
    fastify.put('/:id', { preHandler: authMiddleware }, async (request, reply) => {
        try {
            const { id } = request.params as { id: string };
            
            const targetUserId = ValidationService.validateId(id);
            const currentUserId = request.userId!;
            
            if (targetUserId !== currentUserId) {
                return reply.code(403).send({ 
                    error: 'Vous ne pouvez modifier que votre propre profil' 
                });
            }
            
            const { username, email } = request.body as any;
            
            const updates: any = {};
            
            if (username !== undefined) {
                updates.username = ValidationService.validateUsername(username);
            }
            
            if (email !== undefined) {
                updates.email = ValidationService.validateEmail(email);
            }
            
            if (Object.keys(updates).length === 0) {
                return reply.code(400).send({ error: 'Aucune modification fournie' });
            }
            
            const updatedUser = updateUser(currentUserId, updates);
            return reply.code(200).send(updatedUser);
            
        } catch (error: any) {
            return reply.code(400).send({ error: error.message });
        }
    });
    
    fastify.get('/:id/stats', async (request, reply) => {
        try {
            const { id } = request.params as { id: string };
            
            const userId = ValidationService.validateId(id);
            
            const stats = getUserStats(userId);
            return reply.code(200).send(stats);
            
        } catch (error: any) {
            return reply.code(404).send({ error: error.message });
        }
    });

    fastify.post('/:id/avatar', { preHandler: authMiddleware }, async (request, reply) => {
        try {
            const { id } = request.params as { id: string };
            
            const targetUserId = ValidationService.validateId(id);
            const currentUserId = request.userId!;
            
            if (targetUserId !== currentUserId) {
                return reply.code(403).send({ 
                    error: 'Vous ne pouvez modifier que votre propre avatar' 
                });
            }
            
            const data = await request.file();
            
            if (!data) {
                return reply.code(400).send({ error: 'Aucun fichier fourni' });
            }
            
            const filename = await uploadAvatar(currentUserId, data);
            const avatarUrl = getAvatarUrl(filename);
            
            return reply.code(200).send({ 
                success: true, 
                avatar: filename,
                url: avatarUrl
            });
            
        } catch (error: any) {
            return reply.code(400).send({ error: error.message });
        }
    });

    fastify.get('/:id/friends', async (request, reply) => {
        try {
            const { id } = request.params as { id: string };
            
            const userId = ValidationService.validateId(id);
            
            const friends = getFriends(userId);
            return reply.code(200).send(friends);
            
        } catch (error: any) {
            return reply.code(500).send({ error: error.message });
        }
    });

    fastify.post('/:id/friends', { preHandler: authMiddleware }, async (request, reply) => {
        try {
            const { id } = request.params as { id: string };
            
            const userId = ValidationService.validateId(id);
            const currentUserId = request.userId!;
            
            if (userId !== currentUserId) {
                return reply.code(403).send({ 
                    error: 'Vous ne pouvez ajouter des amis que pour vous-même' 
                });
            }
            
            const { friendId } = request.body as { friendId: number };
            
            if (!friendId) {
                return reply.code(400).send({ error: 'friendId requis' });
            }
            
            const validFriendId = ValidationService.validateId(friendId);
            
            addFriend(currentUserId, validFriendId);
            
            return reply.code(201).send({ 
                success: true, 
                message: 'Ami ajouté' 
            });
            
        } catch (error: any) {
            return reply.code(400).send({ error: error.message });
        }
    });

    fastify.delete('/:id/friends/:friendId', { preHandler: authMiddleware }, async (request, reply) => {
        try {
            const { id, friendId } = request.params as { id: string; friendId: string };
            
            const userId = ValidationService.validateId(id);
            const targetFriendId = ValidationService.validateId(friendId);
            const currentUserId = request.userId!;
            
            if (userId !== currentUserId) {
                return reply.code(403).send({ 
                    error: 'Vous ne pouvez retirer des amis que pour vous-même' 
                });
            }
            
            removeFriend(currentUserId, targetFriendId);
            
            return reply.code(200).send({ 
                success: true, 
                message: 'Ami retiré' 
            });
            
        } catch (error: any) {
            return reply.code(400).send({ error: error.message });
        }
    });

    fastify.get('/:id/friends/online', async (request, reply) => {
        try {
            const { id } = request.params as { id: string };
            
            const userId = ValidationService.validateId(id);
            
            const online = getOnlineFriends(userId);
            return reply.code(200).send(online);
            
        } catch (error: any) {
            return reply.code(500).send({ error: error.message });
        }
    });
}
