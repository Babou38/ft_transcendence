const API_URL = import.meta.env.VITE_API_URL || 'https://localhost:8443';

import { Maze } from "./Maze";
import { Pacman } from "./Pacman";
import { Ghost } from "./Ghost";
import { SoundManager } from "./SoundManager";
import { PACMAN_CONFIG } from "../config/config";
import { GameRecorder } from '../GameRecorder.js';
import { AuthService } from '../../auth/AuthService.js';
import { PacmanEndScreen } from "./PacmanEndScreen";
import { PacmanCustomization, DEFAULT_PACMAN_CUSTOMIZATION, generatePacmanPowerUps, GHOST_SPEED_MULTIPLIERS } from '../config/pacmanCustomization';
import { PacmanPowerUpManager } from './PacmanPowerUpManager';

type GameState = "intro" | "playing" | "dead" | "gameover" | "victory";

export class PacmanGame
{
  private ctx: CanvasRenderingContext2D;
  private gameMode: 'pacman' | 'pacman-duo';
  
  private maze: Maze;
  private pacman1: Pacman;
  private pacman2: Pacman | null = null;
  private ghosts: Ghost[];
  private sound: SoundManager;

  private score1 = 0;
  private score2 = 0;
  private lives1: number;
  private lives2: number;
  private state: GameState = "intro";
  private active: boolean = true;
  
  private vulnerableTimer: number | null = null;
  
  private pacman1Powered = false;
  private pacman2Powered = false;
  private poweredTimer1: number | null = null;
  private poweredTimer2: number | null = null;

  private pelletsEaten = 0;
  private ghostsEaten = 0;
  private totalPellets = 0;
  private endScreen: PacmanEndScreen | null = null;
  
  private keys: Record<string, boolean> = {};

  private settings: PacmanCustomization;
  private powerUpManager: PacmanPowerUpManager;
  private disableEndScreen: boolean = false;

  constructor(private canvas: HTMLCanvasElement, mode: 'pacman' | 'pacman-duo', private player2Info: any | null = null, settings?: PacmanCustomization, disableEndScreen?: boolean, private player1Info?: any)
  {
    this.ctx = canvas.getContext("2d")!;
    this.gameMode = mode;
    this.settings = settings ? { ...settings } : { ...DEFAULT_PACMAN_CUSTOMIZATION };
    this.disableEndScreen = disableEndScreen || false;
    this.lives1 = this.settings.startingLives;
    this.lives2 = this.settings.startingLives;
    

    this.maze = new Maze();
    this.pacman1 = new Pacman(this.maze.startX - 1, this.maze.startY, 1, this.keys);
    this.powerUpManager = new PacmanPowerUpManager(this.settings.powerUpsEnabled);

    if (this.settings.powerUpsEnabled)
    {
      const powerUps = generatePacmanPowerUps(this.maze);
      this.powerUpManager.initPowerUps(powerUps);
    }

    if (this.gameMode === 'pacman-duo')
      this.pacman2 = new Pacman(this.maze.startX + 1, this.maze.startY, 2, this.keys);
    
    this.ghosts = this.createGhosts();
    this.sound = new SoundManager();
    this.totalPellets = this.maze.remainingPellets();

    this.setupEventListeners();
    this.startIntro();
    this.loop();
  }

  private createGhosts(): Ghost[]
  {
    const speedMultiplier = GHOST_SPEED_MULTIPLIERS[this.settings.ghostSpeed];
    const baseDelay = PACMAN_CONFIG.GHOST.MOVE_DELAY_MS;

    return [new Ghost(12, 14, "red", baseDelay * speedMultiplier), new Ghost(14, 14, "pink", baseDelay * speedMultiplier), new Ghost(16, 14, "cyan", baseDelay * speedMultiplier)];
  }

  private setupEventListeners(): void
  {
    const keyDownHandler = (e: KeyboardEvent) => {
      this.keys[e.key] = true;
      
      if (e.key === "Escape")
        window.dispatchEvent(new CustomEvent("exit-pacman"));
    };
    
    const keyUpHandler = (e: KeyboardEvent) => {
      this.keys[e.key] = false;
    };
    
    window.addEventListener("keydown", keyDownHandler);
    window.addEventListener("keyup", keyUpHandler);
  }

  private startIntro(): void
  {
    this.state = "intro";
    
    this.sound.playIntro(() => {
      this.state = "playing";
    });
  }

  public stop(): void
  {
    this.active = false;
    
    if (this.endScreen)
      this.endScreen.cleanup();
  }

  private loop(): void
  {
    if (!this.active)
      return;
    
    if (this.state === "gameover" || this.state === "victory")
    {
      this.draw();
      
      if (this.disableEndScreen)
      {
        this.active = false;
        return;
      }
      
      return;
    }

    this.update();
    this.draw();
    requestAnimationFrame(() => this.loop());
  }

  private update(): void
  {
    if (this.state === "intro") 
      return;

    if (this.state === "dead")
    {
      if (this.gameMode === 'pacman-duo')
      {
        const p1Alive = this.lives1 > 0;
        const p2Alive = this.pacman2 && this.lives2 > 0;
        
        if (p1Alive)
          this.pacman1.update(this.maze, p2Alive ? this.pacman2! : undefined, this.powerUpManager);
        if (p2Alive)
          this.pacman2!.update(this.maze, p1Alive ? this.pacman1 : undefined, this.powerUpManager);
        
        const targetP1 = p1Alive ? this.pacman1 : null;
        const targetP2 = p2Alive ? this.pacman2 : null;
        
        this.ghosts.forEach((g) => {
          if (!targetP1 && !targetP2) return;
          
          const primary = targetP1 || targetP2!;
          const secondary = targetP1 && targetP2 ? targetP2 : null;
          
          g.update(this.maze, primary, secondary, this.ghosts, this.powerUpManager);
        });
        
        this.handlePelletEating();
        this.handleGhostCollisions();
        this.checkVictory();
      }
      else
        this.pacman1.update(this.maze, undefined, this.powerUpManager);
      return;
    }

    if (this.state === "playing")
      this.updateGameplay();
  }

  private updateGameplay(): void
  {
    if (this.state !== "playing") 
      return;

    const p1Alive = this.lives1 > 0;
    const p2Alive = this.pacman2 && this.lives2 > 0;
    
    if (p1Alive)
      this.pacman1.update(this.maze, p2Alive ? this.pacman2! : undefined, this.powerUpManager);
    
    if (p2Alive)
      this.pacman2!.update(this.maze, p1Alive ? this.pacman1 : undefined, this.powerUpManager);
    
    const targetP1 = p1Alive ? this.pacman1 : null;
    const targetP2 = p2Alive ? this.pacman2 : null;
    
    this.ghosts.forEach((g) => {
      if (!targetP1 && !targetP2)
        return;
      
      const primary = targetP1 || targetP2!;
      const secondary = targetP1 && targetP2 ? targetP2 : null;
      
      g.update(this.maze, primary, secondary, this.ghosts, this.powerUpManager);
    });

    this.handlePelletEating();
    if (this.pacman2)
      this.handlePacmanCollision();
    this.handleGhostCollisions();
    this.checkVictory();
  }

  private handlePelletEating(): void
  {
    if (this.lives1 > 0)
    {
      const eaten1 = this.maze.eatPellet(this.pacman1.x, this.pacman1.y);
      
      if (eaten1 === "pellet")
      {
        this.score1 += PACMAN_CONFIG.SCORE.PELLET;
        this.pelletsEaten++;
        this.sound.playWaka();
      }
      else if (eaten1 === "powerPellet")
      {
        this.score1 += PACMAN_CONFIG.SCORE.POWER_PELLET;
        this.pelletsEaten++;
        this.activatePowerMode(1);
      }
    }

    if (this.pacman2 && this.lives2 > 0)
    {
      const eaten2 = this.maze.eatPellet(this.pacman2.x, this.pacman2.y);
      if (eaten2 === "pellet")
      {
        this.score2 += PACMAN_CONFIG.SCORE.PELLET;
        this.pelletsEaten++;
        this.sound.playWaka();
      }
      else if (eaten2 === "powerPellet")
      {
        this.score2 += PACMAN_CONFIG.SCORE.POWER_PELLET;
        this.pelletsEaten++;
        this.activatePowerMode(2);
      }
    }

    if (this.lives1 > 0)
    {
      const powerUp1 = this.powerUpManager.checkCollection(this.pacman1.x, this.pacman1.y, 1);
      if (powerUp1 === 'extra_life')
        this.lives1++;
    }
    if (this.pacman2 && this.lives2 > 0)
    {
      const powerUp2 = this.powerUpManager.checkCollection(this.pacman2.x, this.pacman2.y, 2);
      if (powerUp2 === 'extra_life')
        this.lives2++;
    }
  }

  private activatePowerMode(player: 1 | 2): void
  {
    this.makeGhostsVulnerable();

    if (player === 1)
    {
      if (this.poweredTimer1) 
        clearTimeout(this.poweredTimer1);
      
      this.pacman1Powered = true;
      
      this.poweredTimer1 = window.setTimeout(() => {
        this.pacman1Powered = false;
        this.poweredTimer1 = null;
      }, PACMAN_CONFIG.GAME.VULNERABLE_DURATION_MS);
    }
    else
    {
      if (this.poweredTimer2) 
        clearTimeout(this.poweredTimer2);
      
      this.pacman2Powered = true;
      
      this.poweredTimer2 = window.setTimeout(() => {
        this.pacman2Powered = false;
        this.poweredTimer2 = null;
      }, PACMAN_CONFIG.GAME.VULNERABLE_DURATION_MS);
    }
  }

  private handlePacmanCollision(): void
  {
    if (!this.pacman2) 
      return;
    
    if (this.pacman1.x === this.pacman2.x && this.pacman1.y === this.pacman2.y)
    {
      if (this.pacman1Powered && !this.pacman2Powered && this.lives1 > 0 && this.lives2 > 0)
      {
        this.score1 += PACMAN_CONFIG.SCORE.EAT_PLAYER;
        this.killPacman(2);
      }
      else if (this.pacman2Powered && !this.pacman1Powered && this.lives1 > 0 && this.lives2 > 0)
      {
        this.score2 += PACMAN_CONFIG.SCORE.EAT_PLAYER;
        this.killPacman(1);
      }
    }
  }

  private handleGhostCollisions(): void
  {
    for (const ghost of this.ghosts)
    {
      if (this.lives1 > 0 && ghost.x === this.pacman1.x && ghost.y === this.pacman1.y)
      {
        if (ghost.isVulnerable())
        {
          this.score1 += PACMAN_CONFIG.SCORE.GHOST;
          this.ghostsEaten++;
          ghost.respawnAtHome();
        }
        else
          this.killPacman(1);
      }

      if (this.pacman2 && this.lives2 > 0 && ghost.x === this.pacman2.x && ghost.y === this.pacman2.y)
      {
        if (ghost.isVulnerable())
        {
          this.score2 += PACMAN_CONFIG.SCORE.GHOST;
          this.ghostsEaten++;
          ghost.respawnAtHome();
        }
        else
          this.killPacman(2);
      }
    }
  }

  private checkVictory(): void
  {
    if (this.maze.remainingPellets() === 0)
    {
      this.state = "victory";
      
      let finalScore1 = this.score1;
      let finalScore2 = this.score2;
      
      if (this.gameMode === 'pacman-duo')
      {
        finalScore1 += this.lives1 * PACMAN_CONFIG.SCORE.LIFE_BONUS;
        finalScore2 += this.lives2 * PACMAN_CONFIG.SCORE.LIFE_BONUS;
      }
      
      const winner = this.gameMode === 'pacman-duo' ? (finalScore1 > finalScore2 ? 1 : 2) : undefined;
      const finalScore = this.gameMode === 'pacman-duo' ? Math.max(finalScore1, finalScore2) : finalScore1;
      
      window.dispatchEvent(new CustomEvent("pacman-game-over", {
        detail: {
          player1Score: finalScore1,
          player2Score: finalScore2,
          winner: winner,
          mode: this.gameMode
        }
      }));

      this.recordTournamentOrNormalGame(this.gameMode === 'pacman' || winner === 1 ? 'win' : 'loss', finalScore1, finalScore2, winner);
      
      if (this.disableEndScreen)
      {
        this.active = false;
        return;
      }
      
      if (!this.disableEndScreen)
      {
        this.endScreen = new PacmanEndScreen(
          this.canvas,
          {
            score: finalScore,
            result: 'victory',
            pelletsEaten: this.pelletsEaten,
            ghostsEaten: this.ghostsEaten,
            lives: this.gameMode === 'pacman-duo' && winner === 2 ? this.lives2 : this.lives1,
            mode: this.gameMode === 'pacman-duo' ? 'duo' : 'solo',
            player1Score: this.gameMode === 'pacman-duo' ? finalScore1 : undefined,
            player2Score: this.gameMode === 'pacman-duo' ? finalScore2 : undefined,
            winner: winner,
            player1Lives: this.gameMode === 'pacman-duo' ? this.lives1 : undefined,
            player2Lives: this.gameMode === 'pacman-duo' ? this.lives2 : undefined,
            hasLifeBonus: true
          },
          () => this.handleReplay(),
          () => this.handleMenu()
        );
      }
    }
  }

  private killPacman(player: 1 | 2): void
  {
    if (this.state !== "playing")
      return;

    if (player === 1 && this.pacman1.isDeathAnimationDone())
      return;
    if (player === 2 && this.pacman2 && this.pacman2.isDeathAnimationDone())
      return;

    if (player === 1)
    {
      this.pacman1.startDeath();
      this.pacman1Powered = false;
      if (this.poweredTimer1)
      {
        clearTimeout(this.poweredTimer1);
        this.poweredTimer1 = null;
      }
    }
    else if (this.pacman2)
    {
      this.pacman2.startDeath();
      this.pacman2Powered = false;
      if (this.poweredTimer2)
      {
        clearTimeout(this.poweredTimer2);
        this.poweredTimer2 = null;
      }
    }

    this.state = "dead";
    
    this.sound.playDeath(() => {
      if (player === 1)
      {
        this.lives1--;
        if (this.lives1 <= 0)
        {
          this.pacman1.x = -100;
          this.pacman1.y = -100;
        }
      }
      else if (this.pacman2)
      {
        this.lives2--;
        if (this.lives2 <= 0)
        {
          this.pacman2.x = -100;
          this.pacman2.y = -100;
        }
      }
      

      if (this.gameMode === 'pacman' && this.lives1 <= 0)
        this.waitForDeathAnimationThenGameOver(player);
      else if (this.gameMode === 'pacman-duo' && this.lives1 <= 0 && this.lives2 <= 0)
        this.waitForDeathAnimationThenGameOver(player);
      else
        this.waitForDeathAnimation(player);
    });
    this.powerUpManager.clearActivePowerUps(player);
  }

  private waitForDeathAnimationThenGameOver(dyingPlayer: 1 | 2): void
  {
    const checkAnimation = () => {
      if (this.gameMode === 'pacman')
      {
        if (this.pacman1.isDeathAnimationDone())
          this.showGameOver();
        else
          requestAnimationFrame(checkAnimation);
        return;
      }
      
      const isDone = dyingPlayer === 1 ? this.pacman1.isDeathAnimationDone() : this.pacman2 ? this.pacman2.isDeathAnimationDone() : true;
      
      if (isDone)
        this.showGameOver();
      else
        requestAnimationFrame(checkAnimation);
    };
    checkAnimation();
  }
  
  private showGameOver(): void
  {
    this.state = "gameover";
    
    const finalScore1 = this.score1;
    const finalScore2 = this.score2;
    
    const winner = this.gameMode === 'pacman-duo' ? (finalScore1 > finalScore2 ? 1 : 2) : undefined;
    const finalScore = this.gameMode === 'pacman-duo' ? Math.max(finalScore1, finalScore2) : finalScore1;
    
    window.dispatchEvent(new CustomEvent("pacman-game-over", {
      detail: {
        player1Score: finalScore1,
        player2Score: finalScore2,
        winner: winner,
        mode: this.gameMode
      }
    }));
    
    this.recordTournamentOrNormalGame(this.gameMode === 'pacman-duo' ? (winner === 1 ? 'win' : 'loss') : 'loss', finalScore1, finalScore2, winner);
    
    if (this.disableEndScreen)
    {
      this.active = false;
      return;
    }
    
    if (!this.disableEndScreen)
    {
      this.endScreen = new PacmanEndScreen(
        this.canvas,
        {
          score: finalScore, result: 'gameover', pelletsEaten: this.pelletsEaten, ghostsEaten: this.ghostsEaten, lives: 0,
          mode: this.gameMode === 'pacman-duo' ? 'duo' : 'solo', player1Score: this.gameMode === 'pacman-duo' ? finalScore1 : undefined,
          player2Score: this.gameMode === 'pacman-duo' ? finalScore2 : undefined, winner: winner, player1Lives: 0, player2Lives: 0, hasLifeBonus: false},
        () => this.handleReplay(),
        () => this.handleMenu()
      );
    }
  }

  private waitForDeathAnimation(player: 1 | 2): void
  {
    const checkAnimation = () => {
      const isDone = player === 1 
        ? this.pacman1.isDeathAnimationDone()
        : this.pacman2 ? this.pacman2.isDeathAnimationDone() : true;
      
      if (isDone)
      {
        if (this.gameMode === 'pacman-duo' && this.lives1 <= 0 && this.lives2 <= 0)
          this.showGameOver();
        else
          this.respawn(player);
      }
      else
        requestAnimationFrame(checkAnimation);
    };
    checkAnimation();
  }

  private respawn(player: 1 | 2): void
  {
    if (this.gameMode === 'pacman-duo')
    {
      if (player === 1)
        this.pacman1 = new Pacman(this.maze.startX - 1, this.maze.startY, 1, this.keys);
      else if (this.pacman2)
        this.pacman2 = new Pacman(this.maze.startX + 1, this.maze.startY, 2, this.keys);
      
      this.state = "playing";
      return;
    }
    this.state = "intro";
    this.pacman1 = new Pacman(this.maze.startX - 1, this.maze.startY, 1, this.keys);
    this.ghosts = this.createGhosts();

    this.sound.playIntro(() => {
      this.state = "playing";
    });
  }

  private makeGhostsVulnerable(): void
  {
    if (this.vulnerableTimer)
      clearTimeout(this.vulnerableTimer);

    this.ghosts.forEach((g) => g.setVulnerable(true));

    this.vulnerableTimer = window.setTimeout(() => {
      this.ghosts.forEach((g) => g.setVulnerable(false));
      this.vulnerableTimer = null;
    }, PACMAN_CONFIG.GAME.VULNERABLE_DURATION_MS);
  }

  private draw(): void
  {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;

    const ctx = this.ctx;
    
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.maze.draw(ctx, this.canvas.width, this.canvas.height);
    this.powerUpManager.draw(ctx, this.maze);

    if (this.state === "gameover" || this.state === "victory")
    {
      if (this.endScreen)
      {
        this.ghosts.forEach((g) => g.draw(ctx, this.maze));
        
        if (this.lives1 > 0)
          this.pacman1.draw(ctx, this.maze);
        if (this.pacman2 && this.lives2 > 0)
          this.pacman2.draw(ctx, this.maze);
        
        this.drawHUD();
        
        this.endScreen.draw(ctx);
      }
      return;
    }

    if (this.state === "dead")
    {
      this.ghosts.forEach((g) => g.draw(ctx, this.maze));
      
      if (this.lives1 > 0)
        this.pacman1.draw(ctx, this.maze);
      if (this.pacman2 && this.lives2 > 0)
        this.pacman2.draw(ctx, this.maze);
    }
    else
    {
      if (this.lives1 > 0)
        this.pacman1.draw(ctx, this.maze);
      if (this.pacman2 && this.lives2 > 0)
        this.pacman2.draw(ctx, this.maze);
      this.ghosts.forEach((g) => g.draw(ctx, this.maze));
    }

    this.drawHUD();
    this.powerUpManager.drawActivePowerUps(ctx, this.canvas.width);
  }

  private drawHUD(): void
  {
    const ctx = this.ctx;
    
    if (this.gameMode === 'pacman-duo')
    {
      ctx.fillStyle = "yellow";
      ctx.font = "20px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`P1: ${this.score1}`, 10, 24);
      ctx.fillText(`Lives: ${this.lives1}`, 10, 50);
      
      ctx.fillStyle = "orange";
      ctx.textAlign = "right";
      ctx.fillText(`P2: ${this.score2}`, this.canvas.width - 10, 24);
      ctx.fillText(`Lives: ${this.lives2}`, this.canvas.width - 10, 50);
    }
    else
    {
      ctx.fillStyle = "white";
      ctx.font = "20px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`Score: ${this.score1}`, 10, 24);
      ctx.fillText(`Lives: ${this.lives1}`, 10, 50);
    }
  }

  private handleReplay(): void
  {
    this.score1 = 0;
    this.score2 = 0;
    this.lives1 = PACMAN_CONFIG.GAME.INITIAL_LIVES;
    this.lives2 = PACMAN_CONFIG.GAME.INITIAL_LIVES;
    this.pelletsEaten = 0;
    this.ghostsEaten = 0;
    this.state = "intro";
    this.endScreen = null;
    
    this.maze = new Maze();
    this.totalPellets = this.maze.remainingPellets();
    this.pacman1 = new Pacman(this.maze.startX - 1, this.maze.startY, 1, this.keys);
    
    if (this.gameMode === 'pacman-duo')
      this.pacman2 = new Pacman(this.maze.startX + 1, this.maze.startY, 2, this.keys);
    
    this.ghosts = this.createGhosts();
    
    if (this.settings.powerUpsEnabled)
    {
      const powerUps = generatePacmanPowerUps(this.maze);
      this.powerUpManager.initPowerUps(powerUps);
    }

    this.startIntro();
    this.loop();
  }

  private handleMenu(): void
  {
    if (this.endScreen)
      this.endScreen.cleanup();
    window.dispatchEvent(new CustomEvent("exit-pacman"));
  }

  private async recordPlayer2Game(result: 'win' | 'loss', finalScore1: number, finalScore2: number): Promise<void>
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
          game_type: 'pacman',
          player_score: finalScore2,
          opponent_score: finalScore1,
          result: result
        })
      });
    }
    catch (error)
    {
      console.error('Failed to record game for Player 2:', error);
    }
  }

  private async recordTournamentOrNormalGame(result: 'win' | 'loss', finalScore1: number, finalScore2: number, winner?: 1 | 2): Promise<void>
  {
    const player1IsLogged = this.player1Info ? (!this.player1Info.isGuest && this.player1Info.userId) : AuthService.isAuthenticated();
    const player2IsLogged = this.player2Info && (
      this.player1Info ? (!this.player2Info.isGuest && this.player2Info.userId) : this.player2Info.id);
    
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
              opponent_username: this.gameMode === 'pacman-duo' ? (this.player2Info?.alias || this.player2Info?.username || 'Guest') : undefined,
              game_type: 'pacman',
              player_score: finalScore1,
              opponent_score: this.gameMode === 'pacman-duo' ? finalScore2 : 0,
              result: this.gameMode === 'pacman-duo' ? (winner === 1 ? 'win' : 'loss') : result
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
              game_type: 'pacman',
              player_score: finalScore1,
              opponent_score: this.gameMode === 'pacman-duo' ? finalScore2 : 0,
              result: this.gameMode === 'pacman-duo' ? (winner === 1 ? 'win' : 'loss') : result,
              opponent_username: this.gameMode === 'pacman-duo' ? (this.player2Info?.username || this.player2Info?.alias || 'Guest') : undefined
            });
          }
        }
      }
      catch (error)
      {
        console.error('Failed to record game for Player 1:', error);
      }
    }
    
    if (player2IsLogged && this.player2Info && this.gameMode === 'pacman-duo')
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
            game_type: 'pacman',
            player_score: finalScore2,
            opponent_score: finalScore1,
            result: winner === 1 ? 'loss' : 'win'
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
}