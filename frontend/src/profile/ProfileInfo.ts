import { User } from "./ProfileAPI";
import { ProfileUtils } from "../utils/ProfileUtils";
import { UIHelpers } from "../utils/UIHelpers";

export class ProfileInfo
{
  private avatarImage: HTMLImageElement | null = null;
  private avatarLoaded: boolean = false;
  
  constructor(private user: User)
  {
    this.loadAvatar();
  }
  
  private async loadAvatar(): Promise<void>
  {
    this.avatarImage = await ProfileUtils.loadAvatar(this.user.avatar);
    this.avatarLoaded = this.avatarImage !== null;
  }
  
  updateUser(user: User): void
  {
    this.user = user;
    this.avatarLoaded = false;
    this.loadAvatar();
  }
  
  draw(ctx: CanvasRenderingContext2D, centerX: number, startY: number): void
  {
    const avatarY = startY + 200;
    const avatarRadius = 60;
    
    ProfileUtils.drawCachedAvatar(ctx, this.user.avatar, centerX, avatarY, avatarRadius, this.user.username);
    
    const infoStartY = avatarY + avatarRadius + 50;
    this.drawUserInfo(ctx, centerX, infoStartY);
    
    this.drawSeparator(ctx, centerX, infoStartY + 135);
    
    const controlsY = infoStartY + 165;
    this.drawGameControls(ctx, centerX, controlsY);
  }
  
  private drawUserInfo(ctx: CanvasRenderingContext2D, centerX: number, y: number): void
  {
    const lineHeight = 45;
    
    ProfileUtils.drawInfoLine(ctx, centerX, 'USERNAME', this.user.username, y);
    ProfileUtils.drawInfoLine(ctx, centerX, 'EMAIL', this.user.email, y + lineHeight);
    ProfileUtils.drawInfoLine(ctx, centerX, 'USER ID', `#${this.user.id}`, y + lineHeight * 2);
  }
  
  private drawSeparator(ctx: CanvasRenderingContext2D, centerX: number, y: number): void
  {
    ctx.strokeStyle = '#444444';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(centerX - 250, y);
    ctx.lineTo(centerX + 250, y);
    ctx.stroke();
  }
  
  private drawGameControls(ctx: CanvasRenderingContext2D, centerX: number, y: number): void
  {
    ctx.fillStyle = '#ffffff';
    ctx.font = '24px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('GAME CONTROLS', centerX, y);
    
    const controlsY = y + 50;
    const lineHeight = 40;
    
    // Section Pong
    ctx.fillStyle = '#00ffff';
    ctx.font = 'bold 18px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('PONG', centerX, controlsY);
    
    ctx.fillStyle = '#888888';
    ctx.font = '16px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('• Player 1 (Left - You):', centerX - 250, controlsY + 30);
    ctx.fillStyle = '#ffffff';
    ctx.fillText('W / S', centerX + 50, controlsY + 30);
    
    ctx.fillStyle = '#888888';
    ctx.fillText('• Player 2 (Right):', centerX - 250, controlsY + 30 + lineHeight);
    ctx.fillStyle = '#ffffff';
    ctx.fillText('↑ / ↓ (Arrow Keys)', centerX + 50, controlsY + 30 + lineHeight);
    
    // Section Pacman
    const pacmanY = controlsY + 120;
    ctx.fillStyle = '#00ffff';
    ctx.font = 'bold 18px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('PACMAN', centerX, pacmanY);
    
    ctx.fillStyle = '#888888';
    ctx.font = '16px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('• Player 1 (Left - You):', centerX - 250, pacmanY + 30);
    ctx.fillStyle = '#ffffff';
    ctx.fillText('W A S D', centerX + 50, pacmanY + 30);
    
    ctx.fillStyle = '#888888';
    ctx.fillText('• Player 2 (Right):', centerX - 250, pacmanY + 30 + lineHeight);
    ctx.fillStyle = '#ffffff';
    ctx.fillText('↑ ↓ ← → (Arrow Keys)', centerX + 50, pacmanY + 30 + lineHeight);
  }
}