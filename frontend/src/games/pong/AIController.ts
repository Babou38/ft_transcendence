import { Ball } from "./Ball";
import { Paddle } from "./Paddle";
import { PONG_CONFIG } from "../config/config";

export class AIController
{
  private intervalId: number | null = null;     
  private keyTimeoutId: number | null = null;  
  
  private aiUpKey: string;
  private aiDownKey: string;

  constructor(private canvas: HTMLCanvasElement, private keys: Record<string, boolean>, 
    private ball: Ball, private paddle: Paddle)
  {
    this.aiUpKey = "__AI_UP__";
    this.aiDownKey = "__AI_DOWN__";
  }

  private predictBallYAtX(): number
  {
    const { width, height } = this.canvas;
    
    let { x, y, dx, dy, r } = this.ball;

    if (dx === 0)
      return y;

    const targetX = this.paddle.x;
    const maxIters = PONG_CONFIG.AI.MAX_PREDICTION_ITERATIONS;

    for (let i = 0; i < maxIters; i++)
      {
      const tToTarget = (targetX - x) / dx;

      let tToWall = Infinity;
      if (dy > 0)
      {
        tToWall = (height - r - y) / dy;
      }
      else if (dy < 0)
      {
        tToWall = (r - y) / dy;
      }

      if (tToTarget >= 0 && tToTarget <= tToWall)
      {
        return y + dy * tToTarget;
      }

      x += dx * tToWall; 
      y += dy * tToWall;
      dy = -dy;  

      if ((dx > 0 && x >= targetX) || (dx < 0 && x <= targetX))
      {
        return y;
      }
    }

    return height / 2;
  }

  private setAIKey(key: string, pressed: boolean): void {
    this.keys[key] = pressed;
  }

  start(): void
  {
    if (this.intervalId)
      return;

    this.intervalId = window.setInterval(() => {
      const predictedY = this.predictBallYAtX();
      
      const aimError = (Math.random() - 0.5) * PONG_CONFIG.AI.AIM_ERROR_RANGE;
      const targetY = predictedY + aimError;

      const aiCenter = this.paddle.y + this.paddle.h / 2;
      const delta = targetY - aiCenter;
      const absDelta = Math.abs(delta);

      if (absDelta < PONG_CONFIG.AI.MOVEMENT_THRESHOLD) 
        return;

      let key;
      if (delta < 0)
        key = this.aiUpKey;
      else
        key = this.aiDownKey;

      const paddleSpeed = 400;
      const duration = Math.min(PONG_CONFIG.AI.MAX_DURATION_MS, Math.max(PONG_CONFIG.AI.MIN_DURATION_MS, (absDelta / paddleSpeed) * 1000));

      if (Math.random() < PONG_CONFIG.AI.MISS_PROBABILITY)
        return;

      this.setAIKey(key, true);
 
      if (this.keyTimeoutId) 
        clearTimeout(this.keyTimeoutId);
      
      this.keyTimeoutId = window.setTimeout(() => this.setAIKey(key, false), duration);
    }, PONG_CONFIG.AI.TICK_INTERVAL_MS);
  }

  stop(): void
  {
    if (this.intervalId) clearInterval(this.intervalId);
    
    if (this.keyTimeoutId) clearTimeout(this.keyTimeoutId);
    
    this.setAIKey(this.aiUpKey, false);
    this.setAIKey(this.aiDownKey, false);
    
    this.intervalId = null;
    this.keyTimeoutId = null;
  }
}