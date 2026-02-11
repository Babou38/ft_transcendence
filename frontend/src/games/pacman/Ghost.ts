import { GhostColor } from "./types";
import { Maze } from "./Maze";
import { Pacman } from "./Pacman";
import { PACMAN_CONFIG } from "../config/config";

export class Ghost
{
  x: number;
  y: number;
  
  color: GhostColor;
  
  dirX: number = 0;
  dirY: number = 0;

  private spawnTime: number;     
  private moveDelay: number;     
  private moveTimer: number;     
  
  private vulnerable = false;
  private vulnerableStart = 0;

  private sprite: HTMLImageElement;            
  private vulnerableSprite: HTMLImageElement;
  
  private frameIndex = 0;
  private animTimer = 0;
  
  private colorRow: number;

  constructor(x: number, y: number, color: GhostColor, moveDelay?: number)
  {
    this.x = x;
    this.y = y;
    this.color = color;
    this.spawnTime = performance.now();
    this.moveDelay = moveDelay ?? PACMAN_CONFIG.GHOST.MOVE_DELAY_MS;
    this.moveTimer = performance.now();

    this.sprite = new Image();
    this.sprite.src = PACMAN_CONFIG.SPRITES.GHOST;

    this.vulnerableSprite = new Image();
    this.vulnerableSprite.src = PACMAN_CONFIG.SPRITES.VULNERABLE;

    this.colorRow = this.getColorRow(color);
  }

  private getColorRow(color: GhostColor): number
  {
    switch (color)
    {
      case "red":
        return 0;
      case "pink":
        return 1;
      case "cyan":
        return 2;
    }
  }

  setVulnerable(state: boolean): void
  {
    this.vulnerable = state;
    if (state)
      this.vulnerableStart = performance.now();
  }

  isVulnerable(): boolean
  {
    return this.vulnerable;
  }

  respawnAtHome(): void
  {
    this.x = 14;
    this.y = 14;
    this.setVulnerable(false);
  }

  update(maze: Maze, pacman1: Pacman, pacman2: Pacman | null, ghosts: Ghost[], powerUpManager?: any): void
  {
    const now = performance.now();
    const elapsed = now - this.spawnTime;

    if (elapsed < PACMAN_CONFIG.GHOST.SPAWN_DELAY_MS) 
      return;
    
    if (now - this.moveTimer < this.moveDelay) 
      return;

    if (powerUpManager?.areGhostsFrozen())
      return;

    this.moveTimer = now;
    this.updateAnimation(now);
    this.updateVulnerability(now);
    this.moveTowardTarget(maze, pacman1, pacman2, ghosts);
  }

  private updateAnimation(now: number): void
  {
    if (now - this.animTimer > PACMAN_CONFIG.GHOST.ANIM_DELAY_MS)
    {
      this.frameIndex = (this.frameIndex + 1) % PACMAN_CONFIG.GHOST.FRAME_COUNT;
      this.animTimer = now;
    }
  }

  private updateVulnerability(now: number): void
  {
    if (this.vulnerable)
    {
      const elapsed = now - this.vulnerableStart;
      
      if (elapsed > PACMAN_CONFIG.GAME.VULNERABLE_DURATION_MS)
        this.vulnerable = false;
    }
  }

  private moveTowardTarget(maze: Maze, pacman1: Pacman, pacman2: Pacman | null, ghosts: Ghost[]): void
  {
    const dist1 = Math.abs(this.x - pacman1.x) + Math.abs(this.y - pacman1.y);
    
    let targetPacman = pacman1;
    if (pacman2)
    {
      const dist2 = Math.abs(this.x - pacman2.x) + Math.abs(this.y - pacman2.y);
      targetPacman = dist1 < dist2 ? pacman1 : pacman2;
    }
    
    const directions: [number, number][] = [[0, -1], [0, 1], [-1, 0], [1, 0]];

    directions.sort((a, b) => {
      const distA = Math.abs(this.x + a[0] - targetPacman.x) + Math.abs(this.y + a[1] - targetPacman.y);
      const distB = Math.abs(this.x + b[0] - targetPacman.x) + Math.abs(this.y + b[1] - targetPacman.y);
      
      return this.vulnerable ? distB - distA : distA - distB;
    });

    for (const [dx, dy] of directions)
    {
      const nx = this.x + dx;
      const ny = this.y + dy;

      if (maze.isWall(nx, ny)) 
        continue;

      const occupied = ghosts.some((g) => g !== this && g.x === nx && g.y === ny);
      if (occupied) 
        continue;

      this.x = nx;
      this.y = ny;
      this.dirX = dx;
      this.dirY = dy;
      return;
    }
  }

  draw(ctx: CanvasRenderingContext2D, maze: Maze): void
  {
    const offsetX = maze.offsetX + this.x * PACMAN_CONFIG.TILE_SIZE + PACMAN_CONFIG.TILE_SIZE / 2;
    const offsetY = maze.offsetY + this.y * PACMAN_CONFIG.TILE_SIZE + PACMAN_CONFIG.TILE_SIZE / 2;

    if (this.vulnerable)
      this.drawVulnerableSprite(ctx, offsetX, offsetY);
    else
      this.drawNormalSprite(ctx, offsetX, offsetY);
  }

  private drawVulnerableSprite(ctx: CanvasRenderingContext2D, x: number, y: number): void
  {
    const now = performance.now();
    const elapsed = now - this.vulnerableStart;
    let frame = 0;

    if (elapsed > PACMAN_CONFIG.GAME.VULNERABLE_DURATION_MS - PACMAN_CONFIG.GHOST.BLINK_START_MS)
    {
      const blinkTime = elapsed - (PACMAN_CONFIG.GAME.VULNERABLE_DURATION_MS - PACMAN_CONFIG.GHOST.BLINK_START_MS);
      frame = Math.floor(blinkTime / PACMAN_CONFIG.GHOST.BLINK_INTERVAL_MS) % 2;
    }

    const size = PACMAN_CONFIG.TILE_SIZE * PACMAN_CONFIG.GHOST.SCALE;
    ctx.drawImage(this.vulnerableSprite, frame * PACMAN_CONFIG.GHOST.VULNERABLE_SPRITE_WIDTH, 0,
      PACMAN_CONFIG.GHOST.VULNERABLE_SPRITE_WIDTH, PACMAN_CONFIG.GHOST.VULNERABLE_SPRITE_HEIGHT,
      x - size * 0.5, y - size * 0.5, size, size);
  }

  private drawNormalSprite(ctx: CanvasRenderingContext2D, x: number, y: number): void
  {
    if (!this.sprite.complete)
    {
      this.sprite.onload = () => this.draw(ctx, { offsetX: x, offsetY: y } as Maze);
      return;
    }

    const frameStart = this.getDirectionFrameStart();
    const sx = (frameStart + this.frameIndex) * PACMAN_CONFIG.GHOST.SPRITE_FRAME_WIDTH;
    const sy = this.colorRow * PACMAN_CONFIG.GHOST.SPRITE_FRAME_HEIGHT;
    
    const size = PACMAN_CONFIG.TILE_SIZE * PACMAN_CONFIG.GHOST.SCALE;

    ctx.drawImage(this.sprite, sx, sy, PACMAN_CONFIG.GHOST.SPRITE_FRAME_WIDTH, 
      PACMAN_CONFIG.GHOST.SPRITE_FRAME_HEIGHT, x - size * 0.5, y - size * 0.5, size, size);
  }

  private getDirectionFrameStart(): number
  {
    if (this.dirX > 0) 
      return 0;   
    if (this.dirX < 0) 
      return 2;  
    if (this.dirY < 0) 
      return 4;  
    if (this.dirY > 0) 
      return 6; 
    return 0;
  }
}