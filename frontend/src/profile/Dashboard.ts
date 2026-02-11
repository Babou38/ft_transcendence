import { DashboardStats, GameResult } from "./DashboardAPI";
import { UIHelpers } from "../utils/UIHelpers";
import { ProfileUtils } from "../utils/ProfileUtils";

export class Dashboard
{
  
  constructor(private stats: DashboardStats | null, private loading: boolean) {}
  
  updateStats(stats: DashboardStats | null, loading: boolean): void
  {
    this.stats = stats;
    this.loading = loading;
  }
  
  draw(ctx: CanvasRenderingContext2D, centerX: number, startY: number): void
  {
    if (this.loading)
    {
      UIHelpers.drawLoading(ctx, 'Loading dashboard', centerX, startY + 300);
      return;
    }
    
    if (!this.stats)
    {
      ctx.fillStyle = '#888888';
      ctx.font = '20px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('No data available', centerX, startY + 300);
      return;
    }
    
    const contentStartY = startY + 150;
    
    this.drawOverview(ctx, centerX, contentStartY);
    this.drawCharts(ctx, centerX, contentStartY + 180);
    
    if (this.stats.recentGames && this.stats.recentGames.length > 0)
      this.drawRecentGames(ctx, centerX, contentStartY + 480);
    else
      this.drawNoGamesMessage(ctx, centerX, contentStartY + 500);
  }
  
  private drawOverview(ctx: CanvasRenderingContext2D, centerX: number, y: number): void
  {
    if (!this.stats)
      return;
    
    UIHelpers.drawTitle(ctx, 'STATISTICS OVERVIEW', centerX, y, '#00ffff', 28);
    
    const metrics = [
      { label: 'TOTAL GAMES', value: this.stats.user.totalGames.toString(), color: '#ffffff' },
      { label: 'WIN RATE', value: this.stats.user.winRate.toFixed(1) + '%', color: '#00ffff' },
      { label: 'STREAK', value: this.stats.winStreak.current.toString(), color: '#00ff00' },
      { label: 'RANK', value: `#${this.stats.ranking.position}`, color: '#ffaa00' }
    ];
    
    const cardWidth = 160;
    const cardSpacing = 20;
    const totalWidth = (cardWidth * 4) + (cardSpacing * 3);
    const startX = centerX - (totalWidth / 2);
    
    metrics.forEach((metric, i) => {
      const x = startX + (i * (cardWidth + cardSpacing));
      UIHelpers.drawStatCard(ctx, metric.label, metric.value, x, y + 50, cardWidth, 90, metric.color);
    });
  }
  
  private drawCharts(ctx: CanvasRenderingContext2D, centerX: number, y: number): void
  {
    if (!this.stats)
      return;
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '24px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('DETAILED STATS', centerX, y);
    
    ctx.strokeStyle = '#444444';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(centerX - 250, y + 10);
    ctx.lineTo(centerX + 250, y + 10);
    ctx.stroke();
    
    this.drawWinsLossesChart(ctx, centerX - 180, y + 120);
    
    this.drawGameTypeStats(ctx, centerX + 180, y + 120);
  }
  
  private drawWinsLossesChart(ctx: CanvasRenderingContext2D, x: number, y: number): void
  {
    if (!this.stats)
      return;
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '18px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('WINS VS LOSSES', x, y - 80);
    
    ProfileUtils.drawPieChart(ctx, x, y, 70, this.stats.user.wins, this.stats.user.losses);
    
    if (this.stats.user.wins + this.stats.user.losses > 0)
    {
      ProfileUtils.drawChartLegend(ctx, x - 70, y + 90,
        [
          { label: 'Wins', color: '#00ff00', value: this.stats.user.wins },
          { label: 'Losses', color: '#ff4444', value: this.stats.user.losses }
        ]
      );
    }
  }
  
  private drawGameTypeStats(ctx: CanvasRenderingContext2D, x: number, y: number): void
  {
    if (!this.stats)
      return;
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '18px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('BY GAME TYPE', x, y - 80);
    
    const barWidth = 80;
    const barSpacing = 120;
    const maxHeight = 140;
    
    const pongTotal = this.stats.gamesByType.pong.wins + this.stats.gamesByType.pong.losses;
    const pongWinRate = pongTotal > 0 ? this.stats.gamesByType.pong.wins / pongTotal : 0;
    
    ProfileUtils.drawBarChart(ctx, x - barSpacing / 2 - barWidth / 2, y - 20, barWidth, maxHeight + 20, pongWinRate, 1, '#00ffff', 'PONG');
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${pongTotal} games`, x - barSpacing / 2, y + maxHeight + 38);
    
    const pacmanTotal = this.stats.gamesByType.pacman.wins + this.stats.gamesByType.pacman.losses;
    const pacmanWinRate = pacmanTotal > 0 ? this.stats.gamesByType.pacman.wins / pacmanTotal : 0;
    
    ProfileUtils.drawBarChart(ctx, x + barSpacing / 2 - barWidth / 2, y - 20, barWidth, maxHeight + 20, pacmanWinRate, 1, '#ffaa00', 'PACMAN');
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${pacmanTotal} games`, x + barSpacing / 2, y + maxHeight + 38);
  }
  
  private drawRecentGames(ctx: CanvasRenderingContext2D, centerX: number, y: number): void
  {
    if (!this.stats || !this.stats.recentGames.length)
      return;
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '24px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('RECENT GAMES', centerX, y);
    
    ctx.strokeStyle = '#444444';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(centerX - 250, y + 10);
    ctx.lineTo(centerX + 250, y + 10);
    ctx.stroke();
    
    this.drawGameHistoryHeaders(ctx, centerX, y + 40);
    
    const recentGames = this.stats.recentGames.slice(0, 5);
    recentGames.forEach((game, i) => {
      this.drawGameRow(ctx, centerX, y + 70 + (i * 30), game);
    });
  }
  
  private drawGameHistoryHeaders(ctx: CanvasRenderingContext2D, centerX: number, y: number): void
  {
    ctx.font = '12px monospace';
    ctx.fillStyle = '#888888';
    ctx.textAlign = 'left';
    
    ctx.fillText('GAME', centerX - 220, y);
    ctx.fillText('OPPONENT', centerX - 100, y);
    ctx.fillText('SCORE', centerX + 30, y);
    ctx.fillText('RESULT', centerX + 130, y);
  }
  
  private drawGameRow(ctx: CanvasRenderingContext2D, centerX: number, y: number, game: GameResult): void
  {
    ctx.font = '14px monospace';
    ctx.textAlign = 'left';
    
    ctx.fillStyle = game.gameType === 'pong' ? '#00ffff' : '#ffaa00';
    ctx.fillText(game.gameType.toUpperCase(), centerX - 220, y);
    
    ctx.fillStyle = '#ffffff';
    ctx.fillText(game.opponent || 'AI', centerX - 100, y);
    
    ctx.fillText(game.score, centerX + 30, y);
    
    ctx.fillStyle = game.result === 'win' ? '#00ff00' : '#ff4444';
    ctx.fillText(game.result.toUpperCase(), centerX + 130, y);

    ctx.fillStyle = '#888888';
    ctx.fillText(this.formatDate(game.date), centerX + 200, y);
  }
  
  private drawNoGamesMessage(ctx: CanvasRenderingContext2D, centerX: number, y: number): void
  {
    ctx.fillStyle = '#666666';
    ctx.font = '16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('No recent games yet', centerX, y);
    ctx.fillText('Play some games to see your history!', centerX, y + 25);
  }

  private formatDate(dateStr: string): string
{
  try {
    const date = new Date(dateStr);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return 'N/A';
  }
}

}