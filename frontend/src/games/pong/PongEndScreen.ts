import { PONG_CONFIG } from "../config/config";

interface PongStats
{
  leftScore: number;
  rightScore: number;
  winner: 'left' | 'right';
  duration: number;
  mode: 'solo' | 'duo';
}

export class PongEndScreen
{
  private stats: PongStats;
  private hoveredButton: 'replay' | 'menu' | null = null;
  
  private buttons = {
    replay: { x: 0, y: 0, width: 200, height: 60 },
    menu: { x: 0, y: 0, width: 200, height: 60 }
  };

  constructor(private canvas: HTMLCanvasElement, stats: PongStats, private onReplay: () => void, private onMenu: () => void)
  {
    this.stats = stats;
    this.calculatePositions();
    this.setupEventListeners();
  }

  private calculatePositions(): void
  {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    
    this.buttons.replay.x = centerX - 220;
    this.buttons.replay.y = centerY + 200;
    
    this.buttons.menu.x = centerX + 20;
    this.buttons.menu.y = centerY + 200;
  }

  private setupEventListeners(): void
  {
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.canvas.addEventListener('click', (e) => this.handleClick(e));
  }

  private handleMouseMove(e: MouseEvent): void
  {
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    this.hoveredButton = null;
    
    if (this.isInButton(mouseX, mouseY, this.buttons.replay))
      this.hoveredButton = 'replay';
    else if (this.isInButton(mouseX, mouseY, this.buttons.menu))
      this.hoveredButton = 'menu';
    
    this.canvas.style.cursor = this.hoveredButton ? 'pointer' : 'default';
  }

  private handleClick(e: MouseEvent): void
  {
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    if (this.isInButton(mouseX, mouseY, this.buttons.replay))
    {
      this.cleanup();
      this.onReplay();
    }
    else if (this.isInButton(mouseX, mouseY, this.buttons.menu))
    {
      this.cleanup();
      this.onMenu();
    }
  }

  private isInButton(x: number,  y: number,  button: { x: number; y: number; width: number; height: number }): boolean
  {
    return x >= button.x && x <= button.x + button.width && y >= button.y && y <= button.y + button.height;
  }

  draw(ctx: CanvasRenderingContext2D): void
  {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    
    const isLeftWinner = this.stats.winner === 'left';
    const resultColor = isLeftWinner ? '#00ff00' : '#ff4444';
    
    ctx.fillStyle = resultColor;
    ctx.font = 'bold 64px monospace';
    ctx.textAlign = 'center';
    
    if (this.stats.mode === 'solo')
      ctx.fillText(isLeftWinner ? 'VICTORY!' : 'DEFEAT', centerX, centerY - 150);
    else
      ctx.fillText(`${isLeftWinner ? 'LEFT' : 'RIGHT'} PLAYER WINS!`, centerX, centerY - 150);
    
    ctx.strokeStyle = resultColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(centerX - 300, centerY - 120);
    ctx.lineTo(centerX + 300, centerY - 120);
    ctx.stroke();
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 48px monospace';
    ctx.fillText(`${this.stats.leftScore} - ${this.stats.rightScore}`,  centerX,  centerY - 50);
    
    this.drawStats(ctx, centerX, centerY + 20);
    
    this.drawButton(ctx, '🔄 REPLAY', this.buttons.replay, this.hoveredButton === 'replay' ? '#00ffff' : '#666666');
    this.drawButton(ctx, '📋 MENU', this.buttons.menu, this.hoveredButton === 'menu' ? '#00ffff' : '#666666');
    
    ctx.fillStyle = '#888888';
    ctx.font = '16px monospace';
    ctx.fillText('Click to continue', centerX, centerY + 300);
  }

  private drawStats(ctx: CanvasRenderingContext2D, centerX: number, y: number): void
  {
    const minutes = Math.floor(this.stats.duration / 60);
    const seconds = this.stats.duration % 60;
    const durationText = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    const stats = [
      { label: 'Duration', value: durationText },
      { label: 'Mode', value: this.stats.mode.toUpperCase() },
      { label: 'Winner Score', value: Math.max(this.stats.leftScore, this.stats.rightScore).toString() }
    ];
    
    const cardWidth = 180;
    const cardSpacing = 20;
    const totalWidth = (cardWidth * 3) + (cardSpacing * 2);
    const startX = centerX - (totalWidth / 2);
    
    stats.forEach((stat, i) => {
      const x = startX + (i * (cardWidth + cardSpacing));
      this.drawStatCard(ctx, stat.label, stat.value, x, y, cardWidth);
    });
  }

  private drawStatCard(ctx: CanvasRenderingContext2D, label: string, value: string, x: number, y: number, width: number): void
  {
    const height = 80;
    
    ctx.fillStyle = '#111111';
    ctx.fillRect(x, y, width, height);
    
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);
    
    ctx.fillStyle = '#888888';
    ctx.font = '14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(label, x + width / 2, y + 30);
    
    ctx.fillStyle = '#00ffff';
    ctx.font = 'bold 24px monospace';
    ctx.fillText(value, x + width / 2, y + 60);
  }

  private drawButton(ctx: CanvasRenderingContext2D, text: string, button: { x: number; y: number; width: number; height: number }, color: string): void
  {
    if (color === '#00ffff')
      {
      ctx.fillStyle = 'rgba(0, 255, 255, 0.1)';
      ctx.fillRect(button.x, button.y, button.width, button.height);
    }
    
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.strokeRect(button.x, button.y, button.width, button.height);
    
    ctx.fillStyle = color;
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(text, button.x + button.width / 2, button.y + button.height / 2 + 8);
  }

  cleanup(): void
  {
    this.canvas.removeEventListener('mousemove', this.handleMouseMove);
    this.canvas.removeEventListener('click', this.handleClick);
  }
}