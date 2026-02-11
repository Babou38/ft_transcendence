interface PacmanStats
{
  score: number;
  result: 'victory' | 'gameover';
  pelletsEaten: number;
  ghostsEaten: number;
  lives: number;
  mode: 'solo' | 'duo';
  player1Score?: number;
  player2Score?: number;
  player1Lives?: number;
  player2Lives?: number;
  winner?: 1 | 2;
  hasLifeBonus?: boolean;
}

export class PacmanEndScreen
{
  private stats: PacmanStats;
  private hoveredButton: 'replay' | 'menu' | null = null;
  
  private buttons = {
    replay: { x: 0, y: 0, width: 200, height: 60 },
    menu: { x: 0, y: 0, width: 200, height: 60 }
  };

  constructor(private canvas: HTMLCanvasElement, stats: PacmanStats, private onReplay: () => void, private onMenu: () => void)
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
    return x >= button.x && x <= button.x + button.width && y >= button.y &&  y <= button.y + button.height;
  }

  draw(ctx: CanvasRenderingContext2D): void
  {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    
    if (this.stats.mode === 'duo')
      this.drawDuoEndScreen(ctx, centerX, centerY);
    else
      this.drawSoloEndScreen(ctx, centerX, centerY);
    
    this.drawButton(ctx, '🔄 REPLAY', this.buttons.replay, this.hoveredButton === 'replay' ? '#ffaa00' : '#666666');
    this.drawButton(ctx, '📋 MENU', this.buttons.menu, this.hoveredButton === 'menu' ? '#ffaa00' : '#666666');
    
    ctx.fillStyle = '#888888';
    ctx.font = '16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Click to continue', centerX, centerY + 300);
  }

  private drawSoloEndScreen(ctx: CanvasRenderingContext2D, centerX: number, centerY: number): void
  {
    const isVictory = this.stats.result === 'victory';
    const resultColor = isVictory ? '#ffaa00' : '#ff4444';
    
    ctx.fillStyle = resultColor;
    ctx.font = 'bold 64px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(isVictory ? 'VICTORY!' : 'GAME OVER', centerX, centerY - 150);
    
    ctx.strokeStyle = resultColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(centerX - 300, centerY - 120);
    ctx.lineTo(centerX + 300, centerY - 120);
    ctx.stroke();
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 48px monospace';
    ctx.fillText(`SCORE: ${this.stats.score}`, centerX, centerY - 50);
    
    this.drawSoloStats(ctx, centerX, centerY + 20);
  }

  private drawDuoEndScreen(ctx: CanvasRenderingContext2D, centerX: number, centerY: number): void
  {
    const isVictory = this.stats.result === 'victory';
    const resultColor = isVictory ? '#ffaa00' : '#ff4444';
    
    ctx.fillStyle = resultColor;
    ctx.font = 'bold 64px monospace';
    ctx.textAlign = 'center';
    
    if (isVictory && this.stats.winner)
    {
      const winnerColor = this.stats.winner === 1 ? 'yellow' : 'orange';
      ctx.fillStyle = winnerColor;
      ctx.fillText(`PLAYER ${this.stats.winner} WINS!`, centerX, centerY - 150);
    }
    else if (this.stats.result === 'gameover' && this.stats.winner)
    {
      const winnerColor = this.stats.winner === 1 ? 'yellow' : 'orange';
      ctx.fillStyle = winnerColor;
      ctx.fillText(`PLAYER ${this.stats.winner} WINS!`, centerX, centerY - 150);
    }
    else
      ctx.fillText('GAME OVER', centerX, centerY - 150);
    
    ctx.strokeStyle = resultColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(centerX - 300, centerY - 120);
    ctx.lineTo(centerX + 300, centerY - 120);
    ctx.stroke();
    
    this.drawDuoScores(ctx, centerX, centerY - 50);
    
    this.drawDuoStats(ctx, centerX, centerY + 80);
  }

  private drawDuoScores(ctx: CanvasRenderingContext2D, centerX: number, y: number): void
  {
    const p1Score = this.stats.player1Score ?? 0;
    const p2Score = this.stats.player2Score ?? 0;
    const p1Lives = this.stats.player1Lives ?? 0;
    const p2Lives = this.stats.player2Lives ?? 0;
    const hasBonus = this.stats.hasLifeBonus ?? false;
    
    ctx.fillStyle = 'yellow';
    ctx.font = 'bold 36px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`P1: ${p1Score}`, centerX - 40, y);
    
    if (hasBonus && p1Lives > 0)
    {
      ctx.fillStyle = '#00ff00';
      ctx.font = '16px monospace';
      ctx.fillText(`(+${p1Lives} = ${p1Lives * 500} pts)`, centerX - 40, y + 25);
    }
    
    ctx.fillStyle = '#888888';
    ctx.font = '24px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('VS', centerX, y);
    
    ctx.fillStyle = 'orange';
    ctx.font = 'bold 36px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`P2: ${p2Score}`, centerX + 40, y);
    
    if (hasBonus && p2Lives > 0)
    {
      ctx.fillStyle = '#00ff00';
      ctx.font = '16px monospace';
      ctx.fillText(`(+${p2Lives} = ${p2Lives * 500} pts)`, centerX + 40, y + 25);
    }
  }

  private drawSoloStats(ctx: CanvasRenderingContext2D, centerX: number, y: number): void
  {
    const stats = [
      { label: 'Pellets', value: this.stats.pelletsEaten.toString() },
      { label: 'Ghosts', value: this.stats.ghostsEaten.toString() },
      { label: 'Lives Left', value: this.stats.lives.toString() }
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

  private drawDuoStats(ctx: CanvasRenderingContext2D, centerX: number, y: number): void
  {
    const stats = [
      { label: 'Pellets', value: this.stats.pelletsEaten.toString() },
      { label: 'Ghosts', value: this.stats.ghostsEaten.toString() }
    ];
    
    const cardWidth = 180;
    const cardSpacing = 20;
    const totalWidth = (cardWidth * 2) + cardSpacing;
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
    
    ctx.fillStyle = '#ffaa00';
    ctx.font = 'bold 24px monospace';
    ctx.fillText(value, x + width / 2, y + 60);
  }

  private drawButton(ctx: CanvasRenderingContext2D, text: string, button: { x: number; y: number; width: number; height: number }, color: string): void
  {
    if (color === '#ffaa00')
    {
      ctx.fillStyle = 'rgba(255, 170, 0, 0.1)';
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