import { UIHelpers } from './UIHelpers';
import { ProfileAPI } from '../profile/ProfileAPI';

export class ProfileUtils
{
  private static avatarCache = new Map<string, HTMLImageElement>();

  static async loadAvatar(avatarFilename: string): Promise<HTMLImageElement | null>
  {
    if (!avatarFilename || avatarFilename === 'default-avatar.png')
      return null;

    const avatarUrl = ProfileAPI.getAvatarUrl(avatarFilename);
    
    if (this.avatarCache.has(avatarUrl))
    {
      const cached = this.avatarCache.get(avatarUrl)!;
      if (cached.complete && cached.naturalWidth > 0)
        return cached;
    }

    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        this.avatarCache.set(avatarUrl, img);
        resolve(img);
      };
      
      img.onerror = () => {
        console.error(`Failed to load avatar: ${avatarUrl}`);
        resolve(null);
      };
      
      img.src = avatarUrl;
    });
  }

  static drawCachedAvatar(ctx: CanvasRenderingContext2D, avatarFilename: string, x: number, y: number, radius: number, username: string): void
  {
    const initials = username.substring(0, 2).toUpperCase();
    
    if (!avatarFilename || avatarFilename === 'default-avatar.png')
    {
      UIHelpers.drawAvatar(ctx, null, x, y, radius, initials);
      return;
    }

    const avatarUrl = ProfileAPI.getAvatarUrl(avatarFilename);
    const cached = this.avatarCache.get(avatarUrl);
    
    if (cached && cached.complete && cached.naturalWidth > 0)
      UIHelpers.drawAvatar(ctx, cached, x, y, radius, initials);
    else 
    {
      UIHelpers.drawAvatar(ctx, null, x, y, radius, initials);
      this.loadAvatar(avatarFilename);
    }
  }

  static drawInfoLine(ctx: CanvasRenderingContext2D, centerX: number, label: string, value: string, y: number): void
  {
    ctx.textAlign = 'right';
    ctx.fillStyle = '#888888';
    ctx.font = '18px monospace';
    ctx.fillText(label + ':', centerX - 20, y);
    
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px monospace';
    ctx.fillText(value, centerX + 20, y);
  }

  static drawGameStat(ctx: CanvasRenderingContext2D, label: string, value: string, x: number, y: number, color: string): void
  {
    ctx.textAlign = 'center';
    
    ctx.fillStyle = '#888888';
    ctx.font = '16px monospace';
    ctx.fillText(label, x, y);
    
    ctx.fillStyle = color;
    ctx.font = '32px monospace';
    ctx.fillText(value, x, y + 40);
  }

static drawUserCard(ctx: CanvasRenderingContext2D, user: { username: string; wins: number; losses: number; avatar: string }, centerX: number, y: number, action: 'add' | 'remove', isHovered: boolean, isOnline?: boolean): void
{
  ctx.strokeStyle = '#444444';
  ctx.lineWidth = 2;
  ctx.strokeRect(centerX - 300, y, 600, 70);
  
  const avatarSize = 50;
  const avatarX = centerX - 260;
  const avatarY = y + 35;
  
  this.drawCachedAvatar(ctx, user.avatar, avatarX, avatarY, avatarSize / 2, user.username);

  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffffff';
  ctx.font = '20px monospace';
  ctx.fillText(user.username, centerX - 220, y + 30);

  ctx.fillStyle = '#888888';
  ctx.font = '14px monospace';
  const statsText = `W: ${user.wins} | L: ${user.losses}`;
  ctx.fillText(`W: ${user.wins} | L: ${user.losses}`, centerX - 220, y + 52);
  
  if (isOnline !== undefined)
  {
    const statsWidth = ctx.measureText(statsText).width
    const statusX = centerX - 200 + 50 + statsWidth + 20;
    const statusY = y + 52;
    const statusRadius = 5;
    
    ctx.beginPath();
    ctx.arc(statusX, statusY, statusRadius, 0, Math.PI * 2);
    ctx.fillStyle = isOnline ? '#00ff00' : '#888888';
    ctx.fill();

    ctx.fillStyle = isOnline ? '#00ff00' : '#888888';
    ctx.font = '14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(isOnline ? 'ONLINE' : 'OFFLINE', statusX + 12, statusY + 5);
  }

  const actionButtonColor = action === 'add' ? '#00ff00' : '#ff4444';
  const actionButtonText = action === 'add' ? '+ ADD' : '✕ REMOVE';

  const messageBtnX = centerX + 60;
  const actionBtnX = centerX + 180;

  UIHelpers.drawButton(ctx, 'MESSAGE', messageBtnX, y + 15, 100, 40, isHovered ? '#00d9ff' : '#666666', isHovered);
  UIHelpers.drawButton(ctx, actionButtonText, actionBtnX, y + 15, 100, 40, isHovered ? actionButtonColor : '#666666', isHovered);
}

  static isUserCardButtonHovered(mouseX: number, mouseY: number, centerX: number, y: number): boolean
  {
      return this.isUserCardMessageButtonHovered(mouseX, mouseY, centerX, y) || this.isUserCardActionButtonHovered(mouseX, mouseY, centerX, y);
  }

    static isUserCardMessageButtonHovered(mouseX: number, mouseY: number, centerX: number, y: number): boolean
    {
      return UIHelpers.isInBounds(mouseX, mouseY, { x: centerX + 60, y: y + 15, width: 100, height: 40 });
    }

    static isUserCardActionButtonHovered(mouseX: number, mouseY: number, centerX: number, y: number): boolean
    {
      return UIHelpers.isInBounds(mouseX, mouseY, { x: centerX + 180, y: y + 15, width: 100, height: 40 });
    }

  static drawScrollIndicator(ctx: CanvasRenderingContext2D, centerX: number, y: number, current: number, visible: number, total: number): void
  {
    ctx.fillStyle = '#666666';
    ctx.font = '14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`↑ ${current + 1}-${Math.min(current + visible, total)} / ${total} ↓`, centerX, y);
  }

  static drawPieChart(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, wins: number, losses: number): void
  {
    const total = wins + losses;
    
    if (total === 0)
    {
      ctx.fillStyle = '#222222';
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.fill();
      
      ctx.fillStyle = '#666666';
      ctx.font = '14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('No games yet', x, y + 5);
      return;
    }
    
    const winAngle = (wins / total) * 2 * Math.PI;
    
    ctx.fillStyle = '#00ff00';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.arc(x, y, radius, -Math.PI / 2, -Math.PI / 2 + winAngle);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = '#ff4444';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.arc(x, y, radius, -Math.PI / 2 + winAngle, -Math.PI / 2 + 2 * Math.PI);
    ctx.closePath();
    ctx.fill();
    
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.stroke();
  }

  static drawChartLegend(ctx: CanvasRenderingContext2D, x: number, y: number, items: Array<{ label: string; color: string; value: number }>): void
  {
    ctx.font = '14px monospace';
    ctx.textAlign = 'left';
    
    items.forEach((item, i) => {
      const itemY = y + (i * 25);

      ctx.fillStyle = item.color;
      ctx.fillRect(x, itemY, 12, 12);
      
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`${item.label}: ${item.value}`, x + 18, itemY + 10);
    });
  }

  static drawBarChart(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, maxHeight: number, value: number, max: number, color: string, label: string): void
  {
    const height = max > 0 ? Math.max((value / max) * maxHeight, 5) : 5;
    
    ctx.fillStyle = color;
    ctx.fillRect(x, y + maxHeight - height, width, height);
    
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, maxHeight);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(label, x + width / 2, y + maxHeight + 20);
    
    if (value > 0)
    {
      ctx.fillStyle = color;
      ctx.font = 'bold 16px monospace';
      ctx.fillText(`${((value / max) * 100).toFixed(0)}%`, x + width / 2, y + maxHeight - height - 10);
    }
  }
}