import { FastifyInstance } from 'fastify';
import { WebSocket } from 'ws';
import { verifyToken } from '../auth/SessionManager.js';
import { db } from '../database/db.js';
import { ValidationService } from '../ValidationService.js'; // ✅ AJOUTÉ

interface Client {
  userId: number;
  socket: WebSocket;
}

const clients: Map<number, Client> = new Map();

export function setupWebSocket(fastify: FastifyInstance) {
  fastify.register(async (instance) => {
    instance.get('/ws', { websocket: true }, (connection: any, request) => {
      const socket: WebSocket = connection.socket;

      let userId: number | null = null;

      socket.on('message', async (rawMessage: Buffer) => {
        try {
          const message = JSON.parse(rawMessage.toString());

          // ═══════════════════════════════════════════════════════════════
          // 🔐 AUTHENTIFICATION
          // ═══════════════════════════════════════════════════════════════
          if (message.type === 'auth') {
            // Vérifier le token JWT
            const payload = verifyToken(message.token);
            if (!payload) {
              socket.send(JSON.stringify({ type: 'error', message: 'Token invalide' }));
              socket.close();
              return;
            }

            // Vérifier que la session existe en DB
            const sessionStmt = db.prepare('SELECT user_id FROM sessions WHERE token = ?');
            const session: any = sessionStmt.get(message.token);

            if (!session) {
              socket.send(JSON.stringify({ type: 'error', message: 'Session invalide' }));
              socket.close();
              return;
            }

            // Authentification réussie
            userId = session.user_id;
            if (userId !== null) {
              clients.set(userId, { userId, socket });
            }

            socket.send(JSON.stringify({ type: 'auth', success: true }));
            return;
          }

          // ═══════════════════════════════════════════════════════════════
          // 🛡️ VÉRIFICATION AUTHENTIFICATION
          // ═══════════════════════════════════════════════════════════════
          if (userId === null) {
            socket.send(JSON.stringify({ type: 'error', message: 'Non authentifié' }));
            return;
          }

          // ═══════════════════════════════════════════════════════════════
          // 💬 ENVOI DE MESSAGE
          // ═══════════════════════════════════════════════════════════════
          if (message.type === 'message') {
            const { receiverId, content } = message;
            
            // ✅ ÉTAPE 1 : VALIDATION ET SANITIZATION
            // ─────────────────────────────────────────────────────────────
            try {
              // Validation du receiverId (doit être un nombre positif)
              const validReceiverId = ValidationService.validateId(receiverId);
              
              // Validation et sanitization du contenu (max 1000 caractères + neutralisation XSS)
              const cleanContent = ValidationService.validateText(content, 1000);
              
              // ✅ ÉTAPE 2 : VÉRIFICATIONS MÉTIER
              // ─────────────────────────────────────────────────────────────
              
              // Vérifier les blocages
              const blockedStmt = db.prepare(
                'SELECT id FROM blocked_users WHERE user_id = ? AND blocked_user_id = ?'
              );

              // Vérifier si le receiver a bloqué le sender
              if (blockedStmt.get(validReceiverId, userId)) {
                socket.send(JSON.stringify({ 
                  type: 'error', 
                  message: 'Blocage actif' 
                }));
                return;
              }

              // Vérifier si le sender a bloqué le receiver
              if (blockedStmt.get(userId, validReceiverId)) {
                socket.send(JSON.stringify({ 
                  type: 'error', 
                  message: 'Blocage actif' 
                }));
                return;
              }
              
              // Vérifier l'amitié (obligatoire pour envoyer des messages)
              const friendsStmt = db.prepare(
                'SELECT id FROM friends WHERE user_id = ? AND friend_id = ?'
              );

              if (!friendsStmt.get(userId, validReceiverId)) {
                socket.send(JSON.stringify({ 
                  type: 'error', 
                  message: 'Vous devez être amis pour envoyer des messages' 
                }));
                return;
              }

              // ✅ ÉTAPE 3 : INSERTION EN BASE DE DONNÉES (avec données SÉCURISÉES)
              // ─────────────────────────────────────────────────────────────
              const insertStmt = db.prepare(
                'INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)'
              );
              const result = insertStmt.run(userId, validReceiverId, cleanContent);

              // ✅ ÉTAPE 4 : CONSTRUCTION DU MESSAGE DE RÉPONSE (avec données SÉCURISÉES)
              // ─────────────────────────────────────────────────────────────
              const messageData = {
                type: 'message',
                id: result.lastInsertRowid,
                senderId: userId,
                receiverId: validReceiverId,
                content: cleanContent, // ✅ Contenu SANITIZÉ (< devient &lt;, etc.)
                createdAt: new Date().toISOString()
              };

              // ✅ ÉTAPE 5 : ENVOI AUX UTILISATEURS (avec données SÉCURISÉES)
              // ─────────────────────────────────────────────────────────────
              
              // Envoyer au sender (confirmation)
              socket.send(JSON.stringify(messageData));

              // Envoyer au receiver (si connecté)
              const receiverClient = clients.get(validReceiverId);
              if (receiverClient) {
                receiverClient.socket.send(JSON.stringify(messageData));
              }
              
            } catch (validationError: any) {
              // ✅ ÉTAPE 6 : GESTION DES ERREURS DE VALIDATION
              // ─────────────────────────────────────────────────────────────
              // Si la validation échoue, on renvoie l'erreur au client
              // et on N'INSÈRE RIEN en base de données
              socket.send(JSON.stringify({ 
                type: 'error', 
                message: validationError.message 
              }));
              return; // ← IMPORTANT : arrêter ici, ne pas continuer
            }
          }
          
        } catch (error: any) {
          // Erreur générale (JSON parsing, etc.)
          console.error('WebSocket error:', error);
          socket.send(JSON.stringify({ 
            type: 'error', 
            message: 'Erreur serveur' 
          }));
        }
      });

      // ═══════════════════════════════════════════════════════════════
      // 🔌 DÉCONNEXION
      // ═══════════════════════════════════════════════════════════════
      socket.on('close', () => {
        if (userId !== null) {
          clients.delete(userId);
        }
      });

      // ═══════════════════════════════════════════════════════════════
      // ⚠️ ERREUR WEBSOCKET
      // ═══════════════════════════════════════════════════════════════
      socket.on('error', (error: any) => {
        console.error('WebSocket error:', error);
        if (userId !== null) {
          clients.delete(userId);
        }
      });
    });
  });
}
