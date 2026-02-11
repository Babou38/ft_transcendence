import { Message } from './ChatService';

export class ChatUI {
  static drawChatBox(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    messages: Message[],
    currentUserId: number,
    scrollOffset: number = 0
  ): void {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(x, y, width, height);

    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);

    const messageHeight = 60;
    const startY = y + height - 20;
    let currentY = startY + scrollOffset;

    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      const isOwn = msg.senderId === currentUserId;

      if (currentY < y + 10 || currentY > y + height) {
        currentY -= messageHeight;
        continue;
      }

      ctx.fillStyle = isOwn ? 'rgba(0, 255, 255, 0.2)' : 'rgba(100, 100, 100, 0.3)';
      ctx.fillRect(x + 10, currentY - 45, width - 20, 50);

      ctx.fillStyle = isOwn ? '#00ffff' : '#888888';
      ctx.font = '14px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(msg.senderUsername || `User ${msg.senderId}`, x + 20, currentY - 25);

      ctx.fillStyle = '#ffffff';
      ctx.font = '16px monospace';
      const lines = this.wrapText(ctx, msg.content, width - 40);
      lines.forEach((line, idx) => {
        ctx.fillText(line, x + 20, currentY - 5 + idx * 18);
      });

      currentY -= messageHeight;
    }
  }

  static drawInputField(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    text: string,
    isFocused: boolean
  ): void {
    ctx.fillStyle = isFocused ? 'rgba(0, 255, 255, 0.1)' : 'rgba(50, 50, 50, 0.8)';
    ctx.fillRect(x, y, width, height);

    ctx.strokeStyle = isFocused ? '#00ffff' : '#666666';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);

    ctx.fillStyle = '#ffffff';
    ctx.font = '18px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(text || 'Type your message...', x + 15, y + height / 2 + 6);
  }

  static drawButton(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    width: number,
    height: number,
    isHovered: boolean
  ): void {
    ctx.fillStyle = isHovered ? 'rgba(0, 255, 255, 0.3)' : 'rgba(100, 100, 100, 0.5)';
    ctx.fillRect(x, y, width, height);

    ctx.strokeStyle = isHovered ? '#00ffff' : '#666666';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);

    ctx.fillStyle = '#ffffff';
    ctx.font = '16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(text, x + width / 2, y + height / 2 + 6);
  }

  private static wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    words.forEach(word => {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const metrics = ctx.measureText(testLine);

      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  }
}