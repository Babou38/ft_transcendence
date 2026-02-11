import { ChatService, Message, Conversation } from './ChatService';
import { WebSocketClient } from './WebSocketClient';
import { ChatUI } from './ChatUI';
import { AuthService } from '../auth/AuthService';

export class ChatScreen {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private ws: WebSocketClient;
  private conversations: Conversation[] = [];
  private selectedUserId: number | null = null;
  private messages: Message[] = [];
  private inputText = '';
  private error = '';
  private loading = false;
  private isBlocked = false;
  private currentUserId: number;
  private boundHandleKeyDown: (e: KeyboardEvent) => void;
  private boundClickHandler: (e: MouseEvent) => any;

  constructor(canvas: HTMLCanvasElement, private onClose: () => void) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;

    const user = AuthService.getCurrentUser() || { id: 0 } as any;
    this.currentUserId = user.id;

    this.ws = new WebSocketClient();

    this.boundHandleKeyDown = this.handleKeyDown.bind(this);
    this.boundClickHandler = this.handleClick.bind(this);
    this.canvas.tabIndex = 0;
    this.canvas.style.outline = 'none';

    this.init();
  }

  private async init(): Promise<void> {
    try {
      const token = AuthService.getToken();
      if (!token) throw new Error('Not authenticated');
      await this.ws.connect(token);

      this.ws.onMessage((data) => {
        if (data.type === 'message') {
          const msg = data as Message;

          if (this.selectedUserId && (msg.senderId === this.selectedUserId || msg.receiverId === this.selectedUserId)) {
            this.messages.push(msg);
          } else {
            const otherId = msg.senderId === this.currentUserId ? msg.receiverId : msg.senderId;
            const convIndex = this.conversations.findIndex(c => c.otherUserId === otherId);
            if (convIndex !== -1) {
              this.conversations[convIndex].lastMessage = msg.content;
              this.conversations[convIndex].lastMessageAt = msg.createdAt;
              const [conv] = this.conversations.splice(convIndex, 1);
              this.conversations.unshift(conv);
            }
          }
          this.draw();
        }
      });

      await this.loadConversations();

      this.canvas.focus();
      this.canvas.addEventListener('keydown', this.boundHandleKeyDown);
      this.canvas.addEventListener('click', this.boundClickHandler);
      this.draw();
    } catch (error: any) {
      this.error = error.message || 'Failed to initialize chat';
      this.draw();
    }
  }

  private async loadConversations(): Promise<void> {
    try {
      this.conversations = await ChatService.getConversations();
      this.draw();
    } catch (error: any) {
      this.error = error.message;
    }
  }

public async loadMessages(userId: number): Promise<void> {
  this.loading = true;
  this.selectedUserId = userId;
  
  try {
    this.messages = await ChatService.getConversation(userId); 
    try {
      const blocked = await ChatService.getBlockedUsers();
      this.isBlocked = blocked.some((b: any) => {
        if (typeof b === 'number') return b === userId;
        return b.id === userId;
      });
      if (this.isBlocked) {
        this.inputText = '';
      }
    } catch (err) {
      console.error('Failed to check block status:', err);
      this.isBlocked = false;
    }
  } catch (error: any) {
    this.error = error.message;
  }
  this.loading = false;
  this.draw();
}

  private handleKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      this.cleanup();
      this.onClose();
      return;
    }

    if (this.isBlocked) {
      this.inputText = '';
      this.draw();
      return;
    }

    if (e.key === 'Enter' && this.inputText.trim() && this.selectedUserId) {
      this.sendMessage();
      return;
    }

    if (e.key === 'Backspace') {
      this.inputText = this.inputText.slice(0, -1);
    } else if (e.key.length === 1) {
      if (this.inputText.length < 100) {
        this.inputText += e.key;
      }
    }

    this.draw();
  }

  private async sendMessage(): Promise<void> {
    if (!this.selectedUserId || !this.inputText.trim() || this.isBlocked) return;

    try {
      this.ws.sendMessage(this.selectedUserId, this.inputText.trim());
      this.inputText = '';
      this.draw();
    } catch (error: any) {
      this.error = error.message;
    }
  }

private async handleClick(e: MouseEvent): Promise<void> {
  const rect = this.canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const convPanelWidth = 300;
  const listStartY = 80;
  const itemHeight = 60;

  const backBtnX = convPanelWidth + 20;
  const backBtnY = 20;
  const backBtnW = 80;
  const backBtnH = 30;

  if (x >= backBtnX && x <= backBtnX + backBtnW && y >= backBtnY && y <= backBtnY + backBtnH) {
    this.cleanup();
    this.onClose();
    return;
  }

  const chatX = convPanelWidth + 20;
  const chatY = 80;
  const chatW = this.canvas.width - convPanelWidth - 40;
  const chatH = this.canvas.height - 160 - 60;
  const blockBtnW = 90;
  const blockBtnH = 30;
  const blockBtnX = chatX + chatW - blockBtnW;
  const blockBtnY = chatY + 10;

  const profileBtnW = 100;
  const profileBtnH = 30;
  const profileBtnX = blockBtnX - profileBtnW - 10;
  const profileBtnY = blockBtnY;

  if (x >= profileBtnX && x <= profileBtnX + profileBtnW && y >= profileBtnY && y <= profileBtnY + profileBtnH) {
    if (this.selectedUserId) {
      this.cleanup();
      this.onClose();
      window.dispatchEvent(new CustomEvent('view-user-profile', { 
        detail: { userId: this.selectedUserId } 
      }));
    }
    return;
  }

  if (x >= blockBtnX && x <= blockBtnX + blockBtnW && y >= blockBtnY && y <= blockBtnY + blockBtnH) {
    if (!this.selectedUserId) return;
    const targetId = Number(this.selectedUserId);
    const token = AuthService.getToken();

    if (isNaN(targetId)) {
      this.error = 'ID utilisateur invalide';
      this.draw();
      return;
    }

    if (!token) {
      this.error = 'Token manquant. Vérifiez la session.';
      this.draw();
      return;
    }

    try {
      if (this.isBlocked) {
        await ChatService.unblockUser(targetId);
        this.isBlocked = false;
        this.error = 'Utilisateur débloqué';
      } else {
        await ChatService.blockUser(targetId);
        this.isBlocked = true;
        this.inputText = '';
        this.error = 'Utilisateur bloqué';
      }
    } catch (err: any) {
      this.error = err.message || 'Action failed';
    }
    this.draw();
    return;
  }

  if (x >= 0 && x <= convPanelWidth) {
    const idx = Math.floor((y - listStartY) / itemHeight);
    if (idx >= 0 && idx < this.conversations.length) {
      const conv = this.conversations[idx];
      if (conv) {
        if (x < 100) {
          this.cleanup();
          this.onClose();
          window.dispatchEvent(new CustomEvent('view-user-profile', { 
            detail: { userId: conv.otherUserId } 
          }));
        } else {
          this.loadMessages(conv.otherUserId);
        }
      }
    }
  }
  const inputH = 50;
  const sendBtnX = chatX + chatW - 100;
  const sendBtnY = chatY + chatH + 10;
  const sendBtnW = 100;
  const sendBtnH = inputH;

  if (x >= sendBtnX && x <= sendBtnX + sendBtnW && 
      y >= sendBtnY && y <= sendBtnY + sendBtnH) {
    if (this.selectedUserId && this.inputText.trim() && !this.isBlocked) {
      await this.sendMessage();
    }
    return;
  }
}

  private draw(): void {
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    const convPanelWidth = 300;
    const centerX = this.canvas.width / 2;

    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '20px monospace';
    this.ctx.textAlign = 'left';
 
    
    const backBtnX = convPanelWidth + 20;
    const backBtnY = 20;
    const backBtnW = 80;
    const backBtnH = 30;

    ChatUI.drawButton(this.ctx, '< BACK', backBtnX, backBtnY, backBtnW, backBtnH, false);

    const listStartY = 120;
    const itemHeight = 70;
    this.ctx.textAlign = 'left';
    for (let i = 0; i < this.conversations.length; i++) {
      const conv = this.conversations[i];
      const y = listStartY + i * itemHeight;

      if (this.selectedUserId === conv.otherUserId) {
        this.ctx.fillStyle = 'rgba(0,255,255,0.08)';
        this.ctx.fillRect(0, y - 10, convPanelWidth, itemHeight - 10);
      }

      this.ctx.fillStyle = '#00ffff';
      this.ctx.font = '16px monospace';
      this.ctx.fillText(conv.username, 10, y + 16);

      this.ctx.fillStyle = '#cccccc';
      this.ctx.font = '12px monospace';
      this.ctx.fillText(conv.lastMessage || '', 10, y + 36);
    }

    const chatX = convPanelWidth + 20;
    const chatY = 80;
    const chatW = this.canvas.width - convPanelWidth - 40;
    const chatH = this.canvas.height - 160 - 60;

    ChatUI.drawChatBox(this.ctx, chatX, chatY, chatW, chatH, this.messages, this.currentUserId);

    const blockBtnW = 90;
    const blockBtnH = 30;
    const blockBtnX = chatX + chatW - blockBtnW;
    const blockBtnY = chatY + 10;
    const blockBtnText = this.isBlocked ? 'UNBLOCK' : 'BLOCK';
    ChatUI.drawButton(this.ctx, blockBtnText, blockBtnX, blockBtnY, blockBtnW, blockBtnH, false);

    const profileBtnW = 100;
    const profileBtnH = 30;
    const profileBtnX = blockBtnX - profileBtnW - 10;
    const profileBtnY = blockBtnY;
    ChatUI.drawButton(this.ctx, 'PROFILE', profileBtnX, profileBtnY, profileBtnW, profileBtnH, false);

    const inputH = 50;
    if (!this.isBlocked && this.selectedUserId) {
      ChatUI.drawInputField(this.ctx, chatX, chatY + chatH + 10, chatW - 120, inputH, this.inputText, true);
      ChatUI.drawButton(this.ctx, 'SEND', chatX + chatW - 100, chatY + chatH + 10, 100, inputH, false);
    } else if (this.isBlocked) {
      this.ctx.fillStyle = '#ffcc00';
      this.ctx.font = '14px monospace';
      this.ctx.fillText('You cannot send messages to this user (blocked).', chatX, chatY + chatH + 40);
    }

    if (this.error) {
      this.ctx.fillStyle = '#ff4444';
      this.ctx.font = '14px monospace';
      this.ctx.fillText(this.error, chatX, chatY - 10);
    }
  }

  public cleanup(): void {
    this.canvas.removeEventListener('keydown', this.boundHandleKeyDown);
    this.canvas.removeEventListener('click', this.boundClickHandler);
    this.ws.disconnect();
  }
}