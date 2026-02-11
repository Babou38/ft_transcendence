import { UIHelpers } from '../utils/UIHelpers';
import { GAME_CONFIG } from '../games/config/config';

interface TournamentMatchStats
{
  player1Name: string;
  player2Name: string;
  player1Score: number;
  player2Score: number;
  winnerName: string;
}

export class TournamentMatchEndScreen
{
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  
  private stats: TournamentMatchStats;
  private continueButtonBounds = { x: 0, y: 0, width: 250, height: 60 };
  private hoveredButton: boolean = false;
  
  private mouseMoveHandler: (e: MouseEvent) => void;
  private clickHandler: (e: MouseEvent) => void;
  private keyDownHandler: (e: KeyboardEvent) => void;
  
  private onContinue: () => void;

  constructor(canvas: HTMLCanvasElement, stats: TournamentMatchStats, onContinue: () => void)
  {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.stats = stats;
    this.onContinue = onContinue;
    
    this.mouseMoveHandler = (e: MouseEvent) => this.handleMouseMove(e);
    this.clickHandler = (e: MouseEvent) => this.handleClick(e);
    this.keyDownHandler = (e: KeyboardEvent) => this.handleKeyDown(e);
    
    this.setupEventListeners();
    this.updateButtonBounds();
  }

  private setupEventListeners(): void
  {
    this.canvas.addEventListener('mousemove', this.mouseMoveHandler);
    this.canvas.addEventListener('click', this.clickHandler);
    window.addEventListener('keydown', this.keyDownHandler);
  }

  public cleanup(): void
  {
    this.canvas.removeEventListener('mousemove', this.mouseMoveHandler);
    this.canvas.removeEventListener('click', this.clickHandler);
    window.removeEventListener('keydown', this.keyDownHandler);
  }

  private updateButtonBounds(): void
  {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    
    this.continueButtonBounds = {x: centerX - 125, y: centerY + 150, width: 250, height: 60};
  }

  private handleMouseMove(e: MouseEvent): void
  {
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    this.hoveredButton = UIHelpers.isInBounds(mouseX, mouseY, this.continueButtonBounds);
    this.canvas.style.cursor = this.hoveredButton ? 'pointer' : 'default';
  }

  private handleClick(e: MouseEvent): void
  {
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    if (UIHelpers.isInBounds(mouseX, mouseY, this.continueButtonBounds))
      this.onContinue();
  }

  private handleKeyDown(e: KeyboardEvent): void
  {
    if (e.key === 'Enter' || e.key === ' ')
      this.onContinue();
  }

  public draw(): void
  {
    const ctx = this.ctx;
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    ctx.fillStyle = '#00ff00';
    ctx.font = 'bold 48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${this.stats.winnerName} WINS!`, centerX, centerY - 100);
    
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(centerX - 250, centerY - 70);
    ctx.lineTo(centerX + 250, centerY - 70);
    ctx.stroke();
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px monospace';
    ctx.fillText(`${this.stats.player1Score} - ${this.stats.player2Score}`, centerX, centerY - 20);
    
    ctx.font = '20px monospace';
    ctx.fillStyle = this.stats.winnerName === this.stats.player1Name ? '#00ff00' : '#888888';
    ctx.textAlign = 'left';
    ctx.fillText(this.stats.player1Name, centerX - 200, centerY + 30);
    
    ctx.fillStyle = this.stats.winnerName === this.stats.player2Name ? '#00ff00' : '#888888';
    ctx.textAlign = 'right';
    ctx.fillText(this.stats.player2Name, centerX + 200, centerY + 30);
    
    UIHelpers.drawButton(ctx, 'CONTINUE TO BRACKET', this.continueButtonBounds.x, this.continueButtonBounds.y, this.continueButtonBounds.width, this.continueButtonBounds.height, '#00ffff', this.hoveredButton);
    
    ctx.fillStyle = '#666666';
    ctx.font = '16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Press ENTER or click to continue', centerX, centerY + 250);
  }

  public resize(): void
  {
    this.updateButtonBounds();
  }
}
