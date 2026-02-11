import { Paddle } from "./Paddle";

export abstract class Player
{
  paddle: Paddle;

  constructor(paddle: Paddle)
  {
    this.paddle = paddle;
  }

  abstract update(deltaTime?: number): void;
}