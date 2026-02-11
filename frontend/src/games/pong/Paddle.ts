import { PONG_CONFIG } from "../config/config";

export class Paddle
{
  x: number;
  y: number;
  
  w: number; 
  h: number; 
  
  speed: number; 
  score: number;
  
  upKey: string;
  downKey: string;

  constructor(x: number, y: number, upKey: string, downKey: string)
  {
    this.x = x;
    this.y = y;

    this.score = 0;
    
    this.w = PONG_CONFIG.PADDLE.WIDTH;
    this.h = PONG_CONFIG.PADDLE.HEIGHT;
    this.speed = PONG_CONFIG.PADDLE.SPEED;
    
    this.upKey = upKey;
    this.downKey = downKey;
  }

  update(keys: Record<string, boolean>, canvasHeight: number): void
  {
    if (keys[this.upKey] && this.y > 0)
      this.y -= this.speed;

    if (keys[this.downKey] && this.y + this.h < canvasHeight)
      this.y += this.speed;
  }

  draw(ctx: CanvasRenderingContext2D): void
  {
    ctx.fillStyle = "white";
    ctx.fillRect(this.x, this.y, this.w, this.h);
  }
}