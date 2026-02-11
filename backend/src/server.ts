import fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import websocket from '@fastify/websocket';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import path from 'path';
import { readFileSync } from 'fs';
import { initializeDatabase } from './database/init.js';
import authRoutes from './auth/auth.routes.js';
import usersRoutes from './users/users.routes.js';
import gamesRoutes from './games/games.routes.js';
import chatRoutes from './chat/chat.routes.js';
import { setupWebSocket } from './chat/WebSocketManager.js';

const server = fastify({
  logger: true,
  https: {
    key: readFileSync(path.join(process.cwd(), 'ssl', 'key.pem')),
    cert: readFileSync(path.join(process.cwd(), 'ssl', 'cert.pem'))
  }
});

server.register(fastifyCors, {
  origin: ['https://localhost:8443', 'https://localhost:8080'],
  credentials: true
});

server.register(websocket);

server.register(multipart);

server.register(fastifyStatic, {
  root: path.join(process.cwd(), 'uploads'),
  prefix: '/uploads/'
});

initializeDatabase();

setupWebSocket(server);

server.register(authRoutes, { prefix: '/api/auth' });
server.register(usersRoutes, { prefix: '/api/users' });
server.register(gamesRoutes, { prefix: '/api/games' });
server.register(chatRoutes, { prefix: '/api/chat' });

server.get('/api/health', async (request, reply) => {
  return { status: 'OK', message: 'Backend is running' };
});

const start = async () => {
  try {
    await server.listen({ port: 3000, host: '0.0.0.0' });
  } catch (err) {
    process.exit(1);
  }
};

start();