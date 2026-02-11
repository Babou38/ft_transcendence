import { Player } from "./Player";
import { Paddle } from "./Paddle";

export class HumanPlayer extends Player
{
  private keys: Record<string, boolean>;
  
  private upKey: string;
  private downKey: string;
  
  private canvasHeight: number;

  constructor(paddle: Paddle, keys: Record<string, boolean>, upKey: string,
    downKey: string, canvasHeight: number)
  {
    super(paddle);
    this.keys = keys;
    this.upKey = upKey;
    this.downKey = downKey;
    this.canvasHeight = canvasHeight;
  }

  update(deltaTime: number = 1 / 60): void
  {
    const moveDistance = this.paddle.speed * (deltaTime * 60);

    if (this.keys[this.upKey] && this.paddle.y > 0)
      this.paddle.y -= moveDistance;

    if (this.keys[this.downKey] && this.paddle.y + this.paddle.h < this.canvasHeight)
      this.paddle.y += moveDistance;
  }
}