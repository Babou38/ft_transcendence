import { Paddle } from "./Paddle";
import { PONG_CONFIG } from "../config/config";
import { Obstacle } from "../config/customization";

export class Ball
{
  x: number = 0;
  y: number = 0;
  
  r: number;
  
  dx: number;  
  dy: number;  
  
  baseSpeed: number; 

  private lastResetTime: number = 0;

  constructor()
  {
    this.r = PONG_CONFIG.BALL.RADIUS;
    this.baseSpeed = PONG_CONFIG.BALL.BASE_SPEED;
    this.dx = this.baseSpeed;
    this.dy = this.baseSpeed * 0.5;
  }

  reset(canvasWidth: number, canvasHeight: number): void
  {
    this.x = canvasWidth / 2;
    this.y = canvasHeight / 2;

    let dirX;
    if (Math.random() > 0.5)
      dirX = 1;
    else
      dirX = -1;

    
    const dirY = (Math.random() - 0.5) * PONG_CONFIG.BALL.INITIAL_DIRECTION_Y_RANGE;

    this.dx = dirX * this.baseSpeed;
    this.dy = dirY * this.baseSpeed;
    this.lastResetTime = performance.now();
  }

  update(canvasWidth: number, canvasHeight: number, left: Paddle, 
    right: Paddle, deltaTime: number, obstacles: Obstacle[] = [], speedMultiplier: number = 1.0): void
  {
    const effectiveDx = this.dx * speedMultiplier;
    const effectiveDy = this.dy * speedMultiplier;
    
    this.x += effectiveDx * deltaTime;
    this.y += effectiveDy * deltaTime;

    this.handleWallCollision(canvasHeight);
    this.handlePaddleCollision(left, right);
    this.handleObstacleCollision(obstacles);
    this.handleScoring(canvasWidth, canvasHeight, left, right);
  }

  private handleWallCollision(canvasHeight: number): void
  {
    if (this.y - this.r < 0 || this.y + this.r > canvasHeight)
      this.dy *= -1;
  }

  private handlePaddleCollision(left: Paddle, right: Paddle): void
  {
    if (this.isCollidingWithLeft(left))
    {
      this.dx = Math.abs(this.dx);
      this.x = left.x + left.w + this.r;
      this.applySpeedBoost();
    }

    if (this.isCollidingWithRight(right))
    {
      this.dx = -Math.abs(this.dx);
      this.x = right.x - this.r;
      this.applySpeedBoost();
    }
  }

  private isCollidingWithLeft(paddle: Paddle): boolean
  {
    const inPaddleX = this.x - this.r < paddle.x + paddle.w;
    const inPaddleY = this.y > paddle.y && this.y < paddle.y + paddle.h;
    
    return inPaddleX && inPaddleY;
  }

  private isCollidingWithRight(paddle: Paddle): boolean
  {
    const inPaddleX = this.x + this.r > paddle.x;
    const inPaddleY = this.y > paddle.y && this.y < paddle.y + paddle.h;
    
    return inPaddleX && inPaddleY;
  }

  private applySpeedBoost(): void
  {
    this.dx *= PONG_CONFIG.BALL.SPEED_MULTIPLIER;
    this.dy *= PONG_CONFIG.BALL.SPEED_MULTIPLIER;
  }

  private handleObstacleCollision(obstacles: Obstacle[]): void
  {
    for (const obstacle of obstacles)
    {
      if (this.isCollidingWithObstacle(obstacle))
      {
        const ballCenterX = this.x;
        const ballCenterY = this.y;
        
        const obstacleCenterX = obstacle.x + obstacle.width / 2;
        const obstacleCenterY = obstacle.y + obstacle.height / 2;
        
        const deltaX = Math.abs(ballCenterX - obstacleCenterX);
        const deltaY = Math.abs(ballCenterY - obstacleCenterY);
        
        if (deltaX > deltaY)
        {
          this.dx *= -1;
          
          if (ballCenterX < obstacleCenterX)
            this.x = obstacle.x - this.r;
          else
            this.x = obstacle.x + obstacle.width + this.r;
        }
        else
        {
          this.dy *= -1;
          
          if (ballCenterY < obstacleCenterY)
            this.y = obstacle.y - this.r;
          else
            this.y = obstacle.y + obstacle.height + this.r;
        }
        
        break;
      }
    }
  }

  private isCollidingWithObstacle(obstacle: Obstacle): boolean
  {
    const closestX = Math.max(obstacle.x, Math.min(this.x, obstacle.x + obstacle.width));
    const closestY = Math.max(obstacle.y, Math.min(this.y, obstacle.y + obstacle.height));
    
    const distanceX = this.x - closestX;
    const distanceY = this.y - closestY;
    const distanceSquared = (distanceX * distanceX) + (distanceY * distanceY);
    
    return distanceSquared < (this.r * this.r);
  }

  private handleScoring(canvasWidth: number, canvasHeight: number, left: Paddle, right: Paddle): void
  {
    if (performance.now() - this.lastResetTime < 500)
      return;

    if (this.x < 0)
    {
      right.score++;
      this.reset(canvasWidth, canvasHeight);
    } 
    else if (this.x > canvasWidth)
    {
      left.score++;
      this.reset(canvasWidth, canvasHeight);
    }
  }

  draw(ctx: CanvasRenderingContext2D): void
  {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fillStyle = "white";
    ctx.fill();
  }
}