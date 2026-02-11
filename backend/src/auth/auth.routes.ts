import { FastifyInstance } from 'fastify';
import { registerUser, loginUser } from './AuthService.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { db } from '../database/db.js';
import { verifyPassword } from './PasswordUtils.js';
import { ValidationService } from '../ValidationService.js';

interface RegisterBody {
    email: string;
    username: string;
    password: string;
}

export default async function authRoutes(fastify: FastifyInstance) {

    fastify.post('/register', async (request, reply) => {
        try {
            const { email, username, password } = request.body as RegisterBody;

            if (!email || !username || !password) {
                return reply.code(400).send({ error: 'Tous les champs sont requis' });
            }

            const cleanEmail = ValidationService.validateEmail(email);
            const cleanUsername = ValidationService.validateUsername(username);
            ValidationService.validatePassword(password);

            const newUser = await registerUser(cleanEmail, cleanUsername, password);
            return reply.code(201).send(newUser);

        } catch (error: any) {
            return reply.code(400).send({ error: error.message });
        }
    });

    fastify.post('/login', async (request, reply) => {
        try {
            const { email, password } = request.body as RegisterBody;

            if (!email || !password) {
                return reply.code(400).send({ error: 'Email et mot de passe requis' });
            }

            const cleanEmail = ValidationService.validateEmail(email);
            const result = await loginUser(cleanEmail, password);

            return reply.code(200).send(result);

        } catch (error: any) {
            return reply.code(401).send({ error: error.message });
        }
    });

    fastify.post('/verify', async (request, reply) => {
        try {
            const { email, password } = request.body as { email: string; password: string };

            if (!email || !password) {
                return reply.code(400).send({ error: 'Email et mot de passe requis' });
            }

            const cleanEmail = ValidationService.validateEmail(email);

            const getUserStmt = db.prepare('SELECT * FROM users WHERE email = ?');
            const user: any = getUserStmt.get(cleanEmail);

            if (!user) {
                return reply.code(401).send({ error: 'Identifiants incorrects' });
            }

            const isPasswordValid = await verifyPassword(password, user.password);

            if (!isPasswordValid) {
                return reply.code(401).send({ error: 'Identifiants incorrects' });
            }

            return reply.code(200).send({
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    avatar: user.avatar,
                    wins: user.wins,
                    losses: user.losses
                }
            });

        } catch (error: any) {
            return reply.code(500).send({ error: error.message });
        }
    });

    fastify.get('/me', { preHandler: authMiddleware }, async (request, reply) => {
        const userId = request.userId!;
        
        const userStmt = db.prepare(
            'SELECT id, username, email, avatar, wins, losses FROM users WHERE id = ?'
        );
        const user = userStmt.get(userId);
        
        if (!user) {
            return reply.code(404).send({ error: 'Utilisateur non trouvé' });
        }
        
        return reply.code(200).send(user);
    });

    fastify.post('/logout', { preHandler: authMiddleware }, async (request, reply) => {
        try {
            const authHeader = request.headers.authorization;
            const token = authHeader!.substring(7);
        
            const deleteStmt = db.prepare('DELETE FROM sessions WHERE token = ?');
            deleteStmt.run(token);
        
            return reply.code(200).send({ 
                success: true, 
                message: 'Déconnexion réussie' 
            });
        
        } catch (error: any) {
            return reply.code(500).send({ error: error.message });
        }
    });

    fastify.get('/verify-session', { preHandler: authMiddleware }, async (request, reply) => {
        try {
            const userId = request.userId!;
            
            const stmt = db.prepare(`
                SELECT id, username, email, avatar, wins, losses
                FROM users
                WHERE id = ?
            `);
            
            const user = stmt.get(userId);
            
            if (!user) {
                return reply.code(401).send({ error: 'Utilisateur non trouvé' });
            }
            
            return reply.code(200).send({
                valid: true,
                user: user
            });
            
        } catch (error: any) {
            return reply.code(500).send({ error: error.message });
        }
    });
}
