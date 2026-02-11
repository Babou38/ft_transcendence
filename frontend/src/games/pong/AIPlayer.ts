import { HumanPlayer } from "./HumanPlayer";
import { Ball } from "./Ball";
import { AIController } from "./AIController";
import { Paddle } from "./Paddle";

export class AIPlayer extends HumanPlayer
{
  private ai: AIController;

  constructor(paddle: Paddle, canvas: HTMLCanvasElement, keys: Record<string, boolean>,
    ball: Ball, upKey: string, downKey: string, canvasHeight: number)
  {
    super(paddle, keys, "__AI_UP__", "__AI_DOWN__", canvasHeight);
    
    this.ai = new AIController(canvas, keys, ball, paddle);
  }

  start(): void
  {
    this.ai.start();
  }

  stop(): void
  {
    this.ai.stop();
  }
}