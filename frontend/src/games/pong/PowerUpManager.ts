import { PongPowerUpType, ActivePowerUp, POWERUP_CONFIG } from '../config/customization';
import { Paddle } from './Paddle';

export class PowerUpManager
{
  private activePowerUps: ActivePowerUp[] = [];
  private lastSpawnTime: number = 0;
  private enabled: boolean;
  
  private originalPaddleSizes = new Map<Paddle, number>();
  
  constructor(enabled: boolean)
  {
    this.enabled = enabled;
    this.lastSpawnTime = performance.now();
  }
  
  setEnabled(enabled: boolean): void
  {
    this.enabled = enabled;
    if (!enabled)
      this.clearAll();
  }
  
  update(leftPaddle: Paddle, rightPaddle: Paddle, ballDx: number): number
  {
    if (!this.enabled)
      return ballDx;
    
    const now = performance.now();
    
    this.cleanExpiredPowerUps(leftPaddle, rightPaddle);
    
    if (now - this.lastSpawnTime >= POWERUP_CONFIG.SPAWN_INTERVAL)
    {
      this.spawnRandomPowerUp(leftPaddle, rightPaddle);
      this.lastSpawnTime = now;
    }
    
    return this.applyBallSpeedModifiers(ballDx);
  }
  
  private spawnRandomPowerUp(leftPaddle: Paddle, rightPaddle: Paddle): void
  {
    const types: PongPowerUpType[] = ['paddle_grow', 'paddle_shrink', 'speed_boost', 'slow_motion'];
    const randomType = types[Math.floor(Math.random() * types.length)];
    const randomPlayer: 'left' | 'right' = Math.random() > 0.5 ? 'left' : 'right';
    
    const powerUp: ActivePowerUp = {type: randomType, player: randomPlayer, endTime: performance.now() + POWERUP_CONFIG.DURATION};
    
    this.activePowerUps.push(powerUp);
    
    const paddle = randomPlayer === 'left' ? leftPaddle : rightPaddle;
    this.applyPowerUpEffect(powerUp, paddle);
    
    console.log(`Power-up activated: ${randomType} for ${randomPlayer} player`);
  }
  
  private applyPowerUpEffect(powerUp: ActivePowerUp, paddle: Paddle): void
  {
    switch (powerUp.type)
    {
      case 'paddle_grow':
        if (!this.originalPaddleSizes.has(paddle))
          this.originalPaddleSizes.set(paddle, paddle.h);
        paddle.h = this.originalPaddleSizes.get(paddle)! * POWERUP_CONFIG.PADDLE_GROW_MULTIPLIER;
        break;
        
      case 'paddle_shrink':
        if (!this.originalPaddleSizes.has(paddle))
          this.originalPaddleSizes.set(paddle, paddle.h);
        paddle.h = this.originalPaddleSizes.get(paddle)! * POWERUP_CONFIG.PADDLE_SHRINK_MULTIPLIER;
        break;
        
      case 'speed_boost':
      case 'slow_motion':
        break;
    }
  }
  
  private removePowerUpEffect(powerUp: ActivePowerUp, paddle: Paddle): void
  {
    switch (powerUp.type)
    {
      case 'paddle_grow':
      case 'paddle_shrink':
        const originalSize = this.originalPaddleSizes.get(paddle);
        if (originalSize)
          paddle.h = originalSize;
        break;
        
      case 'speed_boost':
      case 'slow_motion':
        break;
    }
  }
  
  private cleanExpiredPowerUps(leftPaddle: Paddle, rightPaddle: Paddle): void
  {
    const now = performance.now();
    const expired = this.activePowerUps.filter(p => now >= p.endTime);
    
    expired.forEach(powerUp => {
      const paddle = powerUp.player === 'left' ? leftPaddle : rightPaddle;
      this.removePowerUpEffect(powerUp, paddle);
    });
    
    this.activePowerUps = this.activePowerUps.filter(p => now < p.endTime);
  }
  
  private applyBallSpeedModifiers(ballDx: number): number
  {
    let multiplier = 1.0;
    
    for (const powerUp of this.activePowerUps)
    {
      if (powerUp.type === 'speed_boost')
        multiplier *= POWERUP_CONFIG.SPEED_BOOST_MULTIPLIER;
      else if (powerUp.type === 'slow_motion')
        multiplier *= POWERUP_CONFIG.SLOW_MOTION_MULTIPLIER;
    }
    
    return ballDx * multiplier;
  }
  
  private clearAll(): void
  {
    this.activePowerUps = [];
    this.originalPaddleSizes.clear();
  }
  
  draw(ctx: CanvasRenderingContext2D, canvasWidth: number): void
  {
    if (!this.enabled || this.activePowerUps.length === 0)
      return;
    
    const now = performance.now();
    const padding = 20;
    const startY = 100;
    
    this.activePowerUps.forEach((powerUp, index) => {
      const timeLeft = Math.ceil((powerUp.endTime - now) / 1000);
      const x = powerUp.player === 'left' ? padding : canvasWidth - 200 - padding;
      const y = startY + (index * 35);
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(x, y, 200, 30);
      
      const color = this.getPowerUpColor(powerUp.type);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, 200, 30);
      
      ctx.fillStyle = color;
      ctx.font = '14px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`${this.getPowerUpName(powerUp.type)} (${timeLeft}s)`, x + 5, y + 20);
    });
  }
  
  private getPowerUpColor(type: PongPowerUpType): string
  {
    switch (type)
    {
      case 'paddle_grow': 
        return '#00ff00';
      case 'paddle_shrink': 
        return '#ff4444';
      case 'speed_boost': 
        return '#ffaa00';
      case 'slow_motion': 
        return '#00ffff';
    }
  }
  
  private getPowerUpName(type: PongPowerUpType): string
  {
    switch (type)
    {
      case 'paddle_grow': 
        return 'BIG PADDLE';
      case 'paddle_shrink': 
        return 'SMALL PADDLE';
      case 'speed_boost': 
        return 'SPEED UP';
      case 'slow_motion': 
        return 'SLOW-MO';
    }
  }
  
  drawSpawnNotification(ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number): void
  {
    if (!this.enabled || this.activePowerUps.length === 0)
      return;
    
    const now = performance.now();
    const lastPowerUp = this.activePowerUps[this.activePowerUps.length - 1];
    const timeSinceSpawn = now - (lastPowerUp.endTime - POWERUP_CONFIG.DURATION);
    
    if (timeSinceSpawn < 4000)
    {
      const alpha = 1 - (timeSinceSpawn / 4000);
      
      ctx.save();
      ctx.globalAlpha = alpha;
      
      const color = this.getPowerUpColor(lastPowerUp.type);
      const powerUpText = this.getPowerUpName(lastPowerUp.type);
      
      const isSpeedPowerUp = lastPowerUp.type === 'speed_boost' || lastPowerUp.type === 'slow_motion';
      const displayText = isSpeedPowerUp ? powerUpText : `${lastPowerUp.player === 'left' ? 'LEFT' : 'RIGHT'}: ${powerUpText}`;
      
      ctx.fillStyle = color;
      ctx.font = 'bold 32px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(displayText, canvasWidth / 2, canvasHeight / 2 - 50);
      
      ctx.restore();
    }
  }
  
  getActivePowerUps(): ActivePowerUp[]
  {
    return [...this.activePowerUps];
  }
}