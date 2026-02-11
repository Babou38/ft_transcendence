import { PacmanPowerUp, PacmanPowerUpType, ActivePacmanPowerUp, PACMAN_POWERUP_CONFIG } from '../config/pacmanCustomization';
import { Maze } from './Maze';
import { PACMAN_CONFIG } from '../config/config';

export class PacmanPowerUpManager
{
  private powerUps: PacmanPowerUp[] = [];
  private activePowerUps: ActivePacmanPowerUp[] = [];
  private enabled: boolean;
  
  private sprites = new Map<PacmanPowerUpType, HTMLImageElement>();
  private spritesLoaded = false;
  
  constructor(enabled: boolean)
  {
    this.enabled = enabled;
    this.loadSprites();
  }
  
  private loadSprites(): void
  {
    const types: PacmanPowerUpType[] = ['super_speed', 'ghost_freeze', 'extra_life'];
    
    types.forEach(type => {
      const img = new Image();
      img.src = PACMAN_POWERUP_CONFIG.SPRITES[type];
      img.onload = () => {
        this.sprites.set(type, img);
        if (this.sprites.size === types.length)
          this.spritesLoaded = true;
      };
      img.onerror = () => {
        console.warn(`Failed to load power-up sprite: ${type}`);
      };
    });
  }
  
  initPowerUps(powerUps: PacmanPowerUp[]): void
  {
    this.powerUps = powerUps;
  }
  
  setEnabled(enabled: boolean): void
  {
    this.enabled = enabled;
    if (!enabled)
    {
      this.powerUps = [];
      this.activePowerUps = [];
    }
  }
  
  checkCollection(playerX: number, playerY: number, player: 1 | 2): PacmanPowerUpType | null
  {
    if (!this.enabled)
      return null;
    
    for (const powerUp of this.powerUps)
    {
      if (powerUp.active && powerUp.x === playerX && powerUp.y === playerY)
      {
        powerUp.active = false;
        this.activatePowerUp(powerUp.type, player);
        return powerUp.type;
      }
    }
    
    return null;
  }
  
  private activatePowerUp(type: PacmanPowerUpType, player: 1 | 2): void
  {
    if (type === 'extra_life')
      return;
    
    const duration = type === 'super_speed' ? PACMAN_POWERUP_CONFIG.SUPER_SPEED_DURATION : PACMAN_POWERUP_CONFIG.GHOST_FREEZE_DURATION;
    const powerUp: ActivePacmanPowerUp = {type, player, endTime: performance.now() + duration};
    this.activePowerUps.push(powerUp);
  }
  
  update(): void
  {
    if (!this.enabled)
      return;
    
    const now = performance.now();
    const before = this.activePowerUps.length;
    this.activePowerUps = this.activePowerUps.filter(p => p.endTime > now);
  }
  
  clearActivePowerUps(player?: 1 | 2): void
  {
    if (player)
      this.activePowerUps = this.activePowerUps.filter(p => p.player !== player);
    else
      this.activePowerUps = [];
  }
  
  clearWorldPowerUps(): void
  {
    this.powerUps = [];
  }
  
  hasSuperSpeed(player: 1 | 2): boolean
  {
    const now = performance.now();
    return this.activePowerUps.some(p => p.player === player && p.type === 'super_speed' && p.endTime > now);
  }
  
  areGhostsFrozen(): boolean
  {
    const now = performance.now();
    return this.activePowerUps.some(p => p.type === 'ghost_freeze' && p.endTime > now);
  }
  
  draw(ctx: CanvasRenderingContext2D, maze: Maze): void
  {
    if (!this.enabled)
      return;
    
    for (const powerUp of this.powerUps)
    {
      if (!powerUp.active)
        continue;
      
      const offsetX = maze.offsetX + powerUp.x * PACMAN_CONFIG.TILE_SIZE + PACMAN_CONFIG.TILE_SIZE / 2;
      const offsetY = maze.offsetY + powerUp.y * PACMAN_CONFIG.TILE_SIZE + PACMAN_CONFIG.TILE_SIZE / 2;
      
      const sprite = this.sprites.get(powerUp.type);
      const size = 16;
      
      if (sprite && sprite.complete && sprite.naturalWidth > 0)
        ctx.drawImage(sprite, offsetX - size / 2, offsetY - size / 2, size, size);
      else
      {
        const color = PACMAN_POWERUP_CONFIG.COLORS[powerUp.type];
        ctx.fillStyle = color;
        ctx.fillRect(offsetX - size / 2, offsetY - size / 2, size, size);
        
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(offsetX - size / 2, offsetY - size / 2, size, size);
      }
    }
  }
  
  drawActivePowerUps(ctx: CanvasRenderingContext2D, canvasWidth: number): void
  {
    if (!this.enabled || this.activePowerUps.length === 0)
      return;
    
    const now = performance.now();
    const padding = 20;
    const startY = 100;
    
    this.activePowerUps.forEach((powerUp, index) => {
      const timeLeft = Math.max(0, Math.ceil((powerUp.endTime - now) / 1000));
      
      if (timeLeft <= 0)
        return;
      
      const x = powerUp.player === 1 ? padding : canvasWidth - 200 - padding;
      const y = startY + (index * 35);
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(x, y, 200, 30);
      
      const color = PACMAN_POWERUP_CONFIG.COLORS[powerUp.type];
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, 200, 30);
      
      ctx.fillStyle = color;
      ctx.font = '14px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`${this.getPowerUpName(powerUp.type)} (${timeLeft}s)`, x + 5, y + 20);
    });
  }
  
  private getPowerUpName(type: PacmanPowerUpType): string
  {
    switch (type)
    {
      case 'super_speed': return 'SUPER SPEED';
      case 'ghost_freeze': return 'GHOST FREEZE';
      case 'extra_life': return 'EXTRA LIFE';
    }
  }
  
  getActivePowerUps(): ActivePacmanPowerUp[]
  {
    return [...this.activePowerUps];
  }
  
  getWorldPowerUps(): PacmanPowerUp[]
  {
    return this.powerUps;
  }
}