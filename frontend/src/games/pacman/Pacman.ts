import { Direction } from "./types";
import { Maze } from "./Maze";
import { PACMAN_CONFIG, CONTROLS } from "../config/config";

export class Pacman
{
  x: number;
  y: number;
  
  private playerId: 1 | 2;
  
  private keys: Record<string, boolean>;
  
  private moveDelay: number;        
  private lastMove = 0;            
  private direction: Direction = "left"; 

  private image: HTMLImageElement;
  private deathImage: HTMLImageElement;

  private frameIndex = 0;         
  private frameCount: number;      
  private frameTimer = 0;          
  private frameDelay: number;      


  private isDying = false;         
  private deathFrame = 0;          
  private deathFrameCount: number;
  private deathTimer = 0;         
  private deathFrameDelay: number; 
  private deathDone = false;   

  constructor(x: number, y: number, playerId: 1 | 2, keys: Record<string, boolean>)
  {
    this.x = x;
    this.y = y;
    this.playerId = playerId;
    this.keys = keys;
    
    this.moveDelay = PACMAN_CONFIG.PACMAN.MOVE_DELAY_MS;
    this.frameCount = PACMAN_CONFIG.PACMAN.FRAME_COUNT;
    this.frameDelay = PACMAN_CONFIG.PACMAN.FRAME_DELAY_MS;
    this.deathFrameCount = PACMAN_CONFIG.PACMAN.DEATH_FRAME_COUNT;
    this.deathFrameDelay = PACMAN_CONFIG.PACMAN.DEATH_FRAME_DELAY_MS;

    this.image = new Image();
    this.image.src = playerId === 1 
      ? PACMAN_CONFIG.SPRITES.PACMAN 
      : PACMAN_CONFIG.SPRITES.PACMAN_PLAYER2;

    this.deathImage = new Image();
    this.deathImage.src = playerId === 1 
      ? PACMAN_CONFIG.SPRITES.DEATH 
      : PACMAN_CONFIG.SPRITES.DEATH_PLAYER2;
  }

  startDeath(): void
  {
    this.isDying = true;
    this.deathFrame = 0;
    this.deathTimer = performance.now();
    this.deathDone = false;
  }

  isDeathAnimationDone(): boolean
  {
    return this.deathDone;
  }

  update(maze: Maze, otherPacman?: Pacman, powerUpManager?: any): void
  {
    const now = performance.now();

    if (this.isDying)
    {
      this.updateDeathAnimation(now);
      return;
    }

    const speedMultiplier = powerUpManager?.hasSuperSpeed(this.playerId) ? 0.5 : 1.0;
    if (now - this.lastMove < this.moveDelay * speedMultiplier)
      return;

    const direction = this.getInputDirection();
    if (direction)
      this.tryMove(maze, direction, now, otherPacman);

    this.updateAnimation(now);
  }

  private updateDeathAnimation(now: number): void
  {
    if (now - this.deathTimer > this.deathFrameDelay)
    {
      this.deathFrame++;
      this.deathTimer = now;
      
      if (this.deathFrame >= this.deathFrameCount)
        this.deathDone = true;
    }
  }

  private getInputDirection(): { dx: number; dy: number; dir: Direction } | null
  {
    const controls = this.playerId === 1 ? CONTROLS.PACMAN.PLAYER1 : CONTROLS.PACMAN.PLAYER2;

    if (this.keys[controls.UP])
      return { dx: 0, dy: -1, dir: "up" };
    else if (this.keys[controls.DOWN])
      return { dx: 0, dy: 1, dir: "down" };
    else if (this.keys[controls.LEFT])
      return { dx: -1, dy: 0, dir: "left" };
    else if (this.keys[controls.RIGHT])
      return { dx: 1, dy: 0, dir: "right" };
    return null;
  }

  private tryMove(maze: Maze, input: { dx: number; dy: number; dir: Direction }, now: number, otherPacman?: Pacman): void
  {
    let nextX = this.x + input.dx;
    let nextY = this.y + input.dy;

    nextX = this.handleTunnel(nextX, maze.width);

    if (otherPacman && !otherPacman.isDying && nextX === otherPacman.x && nextY === otherPacman.y)
      return;

    if (!maze.isWall(nextX, nextY))
    {
      this.x = nextX;
      this.y = nextY;
      this.direction = input.dir;
      this.lastMove = now;
    }
  }

  private handleTunnel(x: number, mazeWidth: number): number
  {
    if (x < 0) 
      return mazeWidth - 1;
    if (x >= mazeWidth) 
      return 0;      
    return x;
  }

  private updateAnimation(now: number): void
  {
    if (now - this.frameTimer > this.frameDelay)
    {
      this.frameTimer = now;
      this.frameIndex = (this.frameIndex + 1) % this.frameCount;
    }
  }

  draw(ctx: CanvasRenderingContext2D, maze?: Maze): void
  {
    const offsetX = maze?.offsetX ?? 0;
    const offsetY = maze?.offsetY ?? 0;

    const dx = offsetX + this.x * PACMAN_CONFIG.TILE_SIZE;
    const dy = offsetY + this.y * PACMAN_CONFIG.TILE_SIZE;

    ctx.save();
    
    ctx.translate(dx + PACMAN_CONFIG.TILE_SIZE / 2, dy + PACMAN_CONFIG.TILE_SIZE / 2);

    if (!this.isDying)
      this.applyRotation(ctx);

    if (this.isDying)
      this.drawDeathSprite(ctx);
    else
      this.drawNormalSprite(ctx);

    ctx.restore();
  }

  private applyRotation(ctx: CanvasRenderingContext2D): void
  {
    switch (this.direction)
    {
      case "up":
        ctx.rotate(-Math.PI / 2); 
        break;
      case "down":
        ctx.rotate(Math.PI / 2);  
        break;
      case "left":
        ctx.rotate(Math.PI);   
        break;
    }
  }

  private drawDeathSprite(ctx: CanvasRenderingContext2D): void
  {
    const frameWidth = this.deathImage.width / this.deathFrameCount;
    const frameHeight = this.deathImage.height;
    const size = PACMAN_CONFIG.TILE_SIZE * PACMAN_CONFIG.PACMAN.SCALE;
    const sx = this.deathFrame * frameWidth;

    ctx.drawImage(this.deathImage, sx, 0, frameWidth, frameHeight, -size / 2, -size / 2, size, size);
  }

  private drawNormalSprite(ctx: CanvasRenderingContext2D): void
  {
    const sx = this.frameIndex * PACMAN_CONFIG.PACMAN.SPRITE_WIDTH;
    const size = PACMAN_CONFIG.TILE_SIZE * PACMAN_CONFIG.PACMAN.SCALE;

    ctx.drawImage(this.image, sx, 0, PACMAN_CONFIG.PACMAN.SPRITE_WIDTH, PACMAN_CONFIG.PACMAN.SPRITE_HEIGHT, -size / 2, -size / 2, size, size);
  }
}