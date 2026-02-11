const API_URL = import.meta.env.VITE_API_URL || 'https://localhost:8443';

import { Paddle } from "./Paddle";
import { Ball } from "./Ball";
import { HumanPlayer } from "./HumanPlayer";
import { AIPlayer } from "./AIPlayer";
import { Player } from "./Player";
import { PongEndScreen } from "./PongEndScreen";
import { PONG_CONFIG, CONTROLS, PongState } from "../config/config";
import { GameRecorder } from '../GameRecorder.js';
import { AuthService } from '../../auth/AuthService.js';
import { PongCustomization, DEFAULT_PONG_CUSTOMIZATION, BALL_SPEED_MULTIPLIERS, generateObstacles, Obstacle } from "../config/customization";
import { PowerUpManager } from "./PowerUpManager";

export class PongGame
{
  private ctx: CanvasRenderingContext2D;
  private ball: Ball;
  private leftPlayer: Player;  
  private rightPlayer: Player;  
  
  private state: PongState = "playing";
  private active: boolean = true;
  private lastTime: number = 0;
  
  private endScreen: PongEndScreen | null = null;
  private gameStartTime: number = 0;
  
  private settings: PongCustomization;
  private powerUpManager: PowerUpManager;
  private obstacles: Obstacle[] = [];
  private disableEndScreen: boolean = false;

  constructor(private canvas: HTMLCanvasElement, private mode: "solo" | "duo", private keys: Record<string, boolean>, private player2Info: any | null, settings?: PongCustomization, disableEndScreen?: boolean, private player1Info?: any)
  {
    this.ctx = canvas.getContext("2d")!;
    
    this.settings = settings ? { ...settings } : { ...DEFAULT_PONG_CUSTOMIZATION };
    this.disableEndScreen = disableEndScreen || false;
    
    this.ball = new Ball();
    this.ball.baseSpeed *= BALL_SPEED_MULTIPLIERS[this.settings.ballSpeed];
    
    this.gameStartTime = performance.now();
    const leftPaddle = new Paddle(PONG_CONFIG.PADDLE.MARGIN, canvas.height / 2 - PONG_CONFIG.PADDLE.HEIGHT / 2, CONTROLS.PONG.LEFT_PLAYER.UP, CONTROLS.PONG.LEFT_PLAYER.DOWN);
    const rightPaddle = new Paddle(canvas.width - PONG_CONFIG.PADDLE.MARGIN - PONG_CONFIG.PADDLE.WIDTH, canvas.height / 2 - PONG_CONFIG.PADDLE.HEIGHT / 2, CONTROLS.PONG.RIGHT_PLAYER.UP, CONTROLS.PONG.RIGHT_PLAYER.DOWN);
    this.leftPlayer = new HumanPlayer(leftPaddle, keys, CONTROLS.PONG.LEFT_PLAYER.UP, CONTROLS.PONG.LEFT_PLAYER.DOWN, canvas.height);

    if (mode === "solo")
    {
      const ai = new AIPlayer(rightPaddle, canvas, keys, this.ball,
        CONTROLS.PONG.RIGHT_PLAYER.UP, CONTROLS.PONG.RIGHT_PLAYER.DOWN, canvas.height);
      ai.start();
      this.rightPlayer = ai;
    }
    else
    {
      this.rightPlayer = new HumanPlayer(rightPaddle, keys, CONTROLS.PONG.RIGHT_PLAYER.UP,
        CONTROLS.PONG.RIGHT_PLAYER.DOWN, canvas.height);
    }
    
    this.powerUpManager = new PowerUpManager(this.settings.powerUpsEnabled);
    
    if (this.settings.obstacles)
      this.obstacles = generateObstacles(canvas.width, canvas.height);

    this.setupEventListeners();
    this.ball.reset(canvas.width, canvas.height);
    this.lastTime = performance.now();
    this.loop();
  }

  private setupEventListeners(): void
  {
    const handleReturn = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === CONTROLS.MENU.RETURN && this.state === "gameover")
      {
        this.stop();
        window.dispatchEvent(new CustomEvent("exit-pong"));
        window.removeEventListener("keydown", handleReturn);
      }
    };
    window.addEventListener("keydown", handleReturn);
  }

  stop(): void
  {
    this.active = false;
    
    if (this.rightPlayer instanceof AIPlayer)
      this.rightPlayer.stop();
    
    if (this.endScreen)
      this.endScreen.cleanup();
  }

  resize(): void
  {
    const newWidth = this.canvas.width;
    const newHeight = this.canvas.height;
    
    this.leftPlayer.paddle.x = PONG_CONFIG.PADDLE.MARGIN;
    this.leftPlayer.paddle.y = Math.min(this.leftPlayer.paddle.y,  newHeight - this.leftPlayer.paddle.h);
    
    this.rightPlayer.paddle.x = newWidth - PONG_CONFIG.PADDLE.MARGIN - PONG_CONFIG.PADDLE.WIDTH;
    this.rightPlayer.paddle.y = Math.min(this.rightPlayer.paddle.y,  newHeight - this.rightPlayer.paddle.h);
    
    this.ball.x = Math.max(this.ball.r, Math.min(this.ball.x, newWidth - this.ball.r));
    this.ball.y = Math.max(this.ball.r, Math.min(this.ball.y, newHeight - this.ball.r));
    
    if (this.settings.obstacles)
      this.obstacles = generateObstacles(newWidth, newHeight);
    
    if (this.endScreen)
    {
      this.endScreen.cleanup();
      const leftWon = this.leftPlayer.paddle.score >= this.settings.winScore;
      const duration = Math.floor((performance.now() - this.gameStartTime) / 1000);
      
      this.endScreen = new PongEndScreen(
        this.canvas,
        {
          leftScore: this.leftPlayer.paddle.score,
          rightScore: this.rightPlayer.paddle.score,
          winner: leftWon ? 'left' : 'right',
          duration: duration,
          mode: this.mode
        },
        () => this.handleReplay(),
        () => this.handleMenu()
      );
    }
  }

  private update(deltaTime: number): void
  {
    if (this.state !== "playing") 
      return;

    this.leftPlayer.update(deltaTime);
    this.rightPlayer.update(deltaTime);
  
    const speedMultiplier = this.powerUpManager.update(this.leftPlayer.paddle,  this.rightPlayer.paddle, this.ball.dx) / this.ball.dx;
    this.ball.update(this.canvas.width,  this.canvas.height, this.leftPlayer.paddle,  this.rightPlayer.paddle,  deltaTime, this.obstacles, speedMultiplier);

    if (this.leftPlayer.paddle.score >= this.settings.winScore || this.rightPlayer.paddle.score >= this.settings.winScore)
    {
      this.state = "gameover";
      
      const leftWon = this.leftPlayer.paddle.score >= this.settings.winScore;
      const duration = Math.floor((performance.now() - this.gameStartTime) / 1000);

      window.dispatchEvent(new CustomEvent("pong-game-over", {
        detail: {
          leftScore: this.leftPlayer.paddle.score,
          rightScore: this.rightPlayer.paddle.score,
          leftWon: leftWon,
          duration: duration
        }
      }));

      this.recordTournamentOrNormalGame(leftWon, duration);

      if (!this.disableEndScreen)
      {
        this.endScreen = new PongEndScreen(
          this.canvas,
          {
            leftScore: this.leftPlayer.paddle.score,
            rightScore: this.rightPlayer.paddle.score,
            winner: leftWon ? 'left' : 'right',
            duration: duration,
            mode: this.mode
          },
          () => this.handleReplay(),
          () => this.handleMenu()
        );
      }
      
      if (this.rightPlayer instanceof AIPlayer)
        this.rightPlayer.stop();
    }
  }

  private async recordPlayer2Game(leftWon: boolean, duration: number): Promise<void>
  {
    const currentUser = AuthService.getCurrentUser();
    
    try
    {
      const response = await fetch(`${API_URL}/api/games/record-for-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          player_id: this.player2Info.id,
          opponent_username: currentUser?.username || 'Player 1',
          game_type: 'pong',
          player_score: this.rightPlayer.paddle.score,
          opponent_score: this.leftPlayer.paddle.score,
          result: leftWon ? 'loss' : 'win',
          duration_seconds: duration
        })
      });
      
      if (response.ok)
        console.log('Game recorded for Player 2');
    }
    catch (error)
    {
      console.error('Failed to record game for Player 2:', error);
    }
  }

  private async recordTournamentOrNormalGame(leftWon: boolean, duration: number): Promise<void>
  {
    const player1IsLogged = this.player1Info ? (!this.player1Info.isGuest && this.player1Info.userId) : AuthService.isAuthenticated();
    const player2IsLogged = this.player2Info && (this.player1Info ? (!this.player2Info.isGuest && this.player2Info.userId) : this.player2Info.id);
    
    if (!player1IsLogged && !player2IsLogged)
      return;
    
    if (player1IsLogged)
    {
      try
      {
        if (this.player1Info && this.player1Info.userId)
        {
          const response = await fetch(`${API_URL}/api/games/record-for-user`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              player_id: this.player1Info.userId,
              opponent_username: this.mode === 'solo' ? 'AI' : (this.player2Info?.alias || this.player2Info?.username || 'Guest'),
              game_type: 'pong',
              player_score: this.leftPlayer.paddle.score,
              opponent_score: this.rightPlayer.paddle.score,
              result: leftWon ? 'win' : 'loss',
              duration_seconds: duration
            })
          });
          
          if (response.ok)
            console.log('Game recorded for Player 1 (tournament)');
        }
        else
        {
          const token = AuthService.getToken();
          if (token)
          {
            GameRecorder.recordGame({
              game_type: 'pong',
              player_score: this.leftPlayer.paddle.score,
              opponent_score: this.rightPlayer.paddle.score,
              result: leftWon ? 'win' : 'loss',
              opponent_username: this.mode === 'solo' ? 'AI' : (this.player2Info?.username || this.player2Info?.alias || 'Guest'),
              duration_seconds: duration
            });
          }
        }
      }
      catch (error)
      {
        console.error('Failed to record game for Player 1:', error);
      }
    }
    
    if (player2IsLogged && this.player2Info)
    {
      try
      {
        const player2Id = this.player1Info ? this.player2Info.userId : this.player2Info.id;
        
        const response = await fetch(`${API_URL}/api/games/record-for-user`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            player_id: player2Id,
            opponent_username: this.player1Info?.alias || AuthService.getCurrentUser()?.username || 'Player 1',
            game_type: 'pong',
            player_score: this.rightPlayer.paddle.score,
            opponent_score: this.leftPlayer.paddle.score,
            result: leftWon ? 'loss' : 'win',
            duration_seconds: duration
          })
        });
        
        if (response.ok)
          console.log('Game recorded for Player 2');
      }
      catch (error)
      {
        console.error('Failed to record game for Player 2:', error);
      }
    }
  }

  private handleReplay(): void 
  {
    this.state = "playing";
    this.leftPlayer.paddle.score = 0;
    this.rightPlayer.paddle.score = 0;
    this.ball.reset(this.canvas.width, this.canvas.height);
    this.gameStartTime = performance.now();
    this.endScreen = null;
    
    if (this.rightPlayer instanceof AIPlayer)
      this.rightPlayer.start();
  }

  private handleMenu(): void
  {
    this.stop();
    window.dispatchEvent(new CustomEvent("exit-pong"));
  }

  private drawCenterLine(): void
  {
    const ctx = this.ctx;
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.setLineDash([...PONG_CONFIG.GAME.CENTER_LINE_DASH]);
    ctx.beginPath();
    ctx.moveTo(this.canvas.width / 2, 0);
    ctx.lineTo(this.canvas.width / 2, this.canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  private drawScore(): void
  {
    const ctx = this.ctx;
    ctx.font = `${PONG_CONFIG.GAME.SCORE_FONT_SIZE}px monospace`;
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    
    ctx.fillText(`${this.leftPlayer.paddle.score}`,
      this.canvas.width / 2 - PONG_CONFIG.GAME.SCORE_OFFSET_X, PONG_CONFIG.GAME.SCORE_OFFSET_Y);
    
    ctx.fillText(`${this.rightPlayer.paddle.score}`,
      this.canvas.width / 2 + PONG_CONFIG.GAME.SCORE_OFFSET_X, PONG_CONFIG.GAME.SCORE_OFFSET_Y);
  }

  private drawObstacles(): void
  {
    if (this.obstacles.length === 0)
      return;
    
    const ctx = this.ctx;
    ctx.fillStyle = "#444444";
    ctx.strokeStyle = "#888888";
    ctx.lineWidth = 2;
    
    for (const obstacle of this.obstacles)
    {
      ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
      ctx.strokeRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    }
  }

  private draw(deltaTime: number): void
  {
    const ctx = this.ctx;
    
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.state === "playing")
    {
      this.update(deltaTime);
      this.drawCenterLine();
      this.drawObstacles();
      this.leftPlayer.paddle.draw(ctx);
      this.rightPlayer.paddle.draw(ctx);
      this.ball.draw(ctx);
      this.drawScore();
      
      this.powerUpManager.draw(ctx, this.canvas.width);
      this.powerUpManager.drawSpawnNotification(ctx, this.canvas.width, this.canvas.height);
    }
    else if (this.state === "gameover" && this.endScreen)
    {
      this.drawCenterLine();
      this.drawObstacles();
      this.leftPlayer.paddle.draw(ctx);
      this.rightPlayer.paddle.draw(ctx);
      this.ball.draw(ctx);
      this.drawScore();
      
      this.endScreen.draw(ctx);
    }
  }

  private loop(currentTime: number = 0): void 
  {
    if (!this.active) 
      return;


    const deltaTimeRaw = (currentTime - this.lastTime) / 1000;
    const deltaTime = Math.min(Math.max(deltaTimeRaw, 0), 0.05);

    this.lastTime = currentTime;

    this.draw(deltaTime);
    
    requestAnimationFrame((time) => this.loop(time));
  }
}