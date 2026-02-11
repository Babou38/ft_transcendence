const API_URL = import.meta.env.VITE_API_URL || window.location.origin;

export interface ChatMessage {
  type: 'message';
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  createdAt: string;
}

type MessageHandler = (data: ChatMessage) => void;

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private handlers: Set<MessageHandler> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const wsUrl = API_URL.replace('https://', 'wss://').replace('http://', 'ws://');
      this.ws = new WebSocket(`${wsUrl}/ws`);

      this.ws.onopen = () => {
        this.ws?.send(JSON.stringify({ type: 'auth', token }));
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.type === 'auth' && data.success) {
          resolve();
          return;
        }

        if (data.type === 'error') {
          return;
        }

        this.handlers.forEach(handler => handler(data));
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        reject(error);
      };

      this.ws.onclose = () => {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          setTimeout(() => {
            this.reconnectAttempts++;
            this.connect(token);
          }, 2000);
        }
      };
    });
  }

  sendMessage(receiverId: number, content: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'message', receiverId, content }));
    }
  }

  onMessage(handler: MessageHandler): void {
    this.handlers.add(handler);
  }

  offMessage(handler: MessageHandler): void {
    this.handlers.delete(handler);
  }

  disconnect(): void {
    this.ws?.close();
    this.ws = null;
    this.handlers.clear();
  }
}