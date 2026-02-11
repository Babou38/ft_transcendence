import { FastifyInstance } from 'fastify';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { recordGame, GameRecord } from './GamesService.js';
import { ValidationService } from '../ValidationService.js';

export default async function gamesRoutes(fastify: FastifyInstance) {
  
    fastify.post('/', { preHandler: authMiddleware }, async (request, reply) => {
        try {
            const userId = request.userId!;
            const body = request.body as any;
            
            if (!body.game_type || !['pong', 'pacman'].includes(body.game_type)) {
                return reply.code(400).send({ error: 'game_type invalide (pong ou pacman)' });
            }
            
            if (body.player_score === undefined || body.opponent_score === undefined) {
                return reply.code(400).send({ error: 'Scores requis' });
            }
            
            const playerScore = parseInt(body.player_score);
            const opponentScore = parseInt(body.opponent_score);
            
            if (isNaN(playerScore) || isNaN(opponentScore)) {
                return reply.code(400).send({ error: 'Scores invalides' });
            }
            
            if (playerScore < 0 || opponentScore < 0) {
                return reply.code(400).send({ error: 'Les scores ne peuvent pas être négatifs' });
            }
            
            if (playerScore > 1000 || opponentScore > 1000) {
                return reply.code(400).send({ error: 'Scores trop élevés' });
            }
            
            if (!body.result || !['win', 'loss'].includes(body.result)) {
                return reply.code(400).send({ error: 'result invalide (win ou loss)' });
            }
            
            let cleanOpponentUsername = undefined;
            if (body.opponent_username) {
                cleanOpponentUsername = ValidationService.validateText(body.opponent_username, 20);
            }
            
            let durationSeconds = undefined;
            if (body.duration_seconds !== undefined) {
                durationSeconds = parseInt(body.duration_seconds);
                if (isNaN(durationSeconds) || durationSeconds < 0) {
                    return reply.code(400).send({ error: 'Durée invalide' });
                }
            }
            
            const game: GameRecord = {
                player_id: userId,
                opponent_username: cleanOpponentUsername,
                game_type: body.game_type,
                player_score: playerScore,
                opponent_score: opponentScore,
                result: body.result,
                duration_seconds: durationSeconds
            };
            
            recordGame(game);
            
            return reply.code(201).send({
                success: true,
                message: 'Partie enregistrée'
            });
            
        } catch (error: any) {
            return reply.code(500).send({ error: error.message });
        }
    });

    fastify.post('/record-for-user', async (request, reply) => {
        try {
            const body = request.body as any;
            
            if (!body.player_id) {
                return reply.code(400).send({ error: 'player_id requis' });
            }
            
            const playerId = ValidationService.validateId(body.player_id);
            
            if (!body.game_type || !['pong', 'pacman'].includes(body.game_type)) {
                return reply.code(400).send({ error: 'game_type invalide' });
            }
            
            if (body.player_score === undefined || body.opponent_score === undefined) {
                return reply.code(400).send({ error: 'Scores requis' });
            }
            
            const playerScore = parseInt(body.player_score);
            const opponentScore = parseInt(body.opponent_score);
            
            if (isNaN(playerScore) || isNaN(opponentScore)) {
                return reply.code(400).send({ error: 'Scores invalides' });
            }
            
            if (playerScore < 0 || opponentScore < 0) {
                return reply.code(400).send({ error: 'Les scores ne peuvent pas être négatifs' });
            }
            
            if (playerScore > 1000 || opponentScore > 1000) {
                return reply.code(400).send({ error: 'Scores trop élevés' });
            }
            
            if (!body.result || !['win', 'loss'].includes(body.result)) {
                return reply.code(400).send({ error: 'result invalide' });
            }
            
            let cleanOpponentUsername = undefined;
            if (body.opponent_username) {
                cleanOpponentUsername = ValidationService.validateText(body.opponent_username, 20);
            }
            
            let durationSeconds = undefined;
            if (body.duration_seconds !== undefined) {
                durationSeconds = parseInt(body.duration_seconds);
                if (isNaN(durationSeconds) || durationSeconds < 0) {
                    return reply.code(400).send({ error: 'Durée invalide' });
                }
            }
            
            const game: GameRecord = {
                player_id: playerId,
                opponent_username: cleanOpponentUsername,
                game_type: body.game_type,
                player_score: playerScore,
                opponent_score: opponentScore,
                result: body.result,
                duration_seconds: durationSeconds
            };
            
            recordGame(game);
            
            return reply.code(201).send({
                success: true,
                message: 'Partie enregistrée'
            });
            
        } catch (error: any) {
            return reply.code(500).send({ error: error.message });
        }
    });
}
