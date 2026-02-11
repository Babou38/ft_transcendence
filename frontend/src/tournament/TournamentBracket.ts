import { UIHelpers } from '../utils/UIHelpers';
import { MenuHelpers } from '../utils/MenuHelpers';
import { GAME_CONFIG } from '../games/config/config';
import { Tournament, TournamentMatch } from './Tournament';

export class TournamentBracket
{
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  
  private tournament: Tournament;
  
  private playButtonBounds = { x: 0, y: 0, width: 200, height: 50 };
  private exitButtonBounds = { x: 0, y: 0, width: 200, height: 50 };
  
  private hoveredButton: 'play' | 'exit' | null = null;
  
  private mouseMoveHandler: (e: MouseEvent) => void;
  private clickHandler: (e: MouseEvent) => void;
  private keyDownHandler: (e: KeyboardEvent) => void;
  
  private onPlayMatch: (match: TournamentMatch) => void;
  private onExit: () => void;

  constructor(canvas: HTMLCanvasElement, tournament: Tournament, onPlayMatch: (match: TournamentMatch) => void, onExit: () => void)
  {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.tournament = tournament;
    this.onPlayMatch = onPlayMatch;
    this.onExit = onExit;
    
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
    
    this.playButtonBounds = {x: centerX - 100, y: centerY + 180, width: 200, height: 50};
    this.exitButtonBounds = {x: centerX - 100, y: centerY + 250, width: 200, height: 50};
  }

  private handleMouseMove(e: MouseEvent): void
  {
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    this.hoveredButton = null;
    
    const nextMatch = this.tournament.getNextMatch();
    
    if (nextMatch && UIHelpers.isInBounds(mouseX, mouseY, this.playButtonBounds))
      this.hoveredButton = 'play';
    else if (UIHelpers.isInBounds(mouseX, mouseY, this.exitButtonBounds))
      this.hoveredButton = 'exit';
    
    this.canvas.style.cursor = this.hoveredButton ? 'pointer' : 'default';
  }

  private handleClick(e: MouseEvent): void
  {
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const nextMatch = this.tournament.getNextMatch();
    
    if (nextMatch && UIHelpers.isInBounds(mouseX, mouseY, this.playButtonBounds))
      this.onPlayMatch(nextMatch);
    else if (UIHelpers.isInBounds(mouseX, mouseY, this.exitButtonBounds))
      this.onExit();
  }

  private handleKeyDown(e: KeyboardEvent): void
  {
    if (e.key === 'Escape')
      this.onExit();
    else if (e.key === 'Enter' || e.key === ' ')
    {
      const nextMatch = this.tournament.getNextMatch();
      if (nextMatch)
        this.onPlayMatch(nextMatch);
    }
  }

  private drawMatches(): void
  {
    const ctx = this.ctx;
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    
    const currentRound = this.tournament.getCurrentRound();
    
    const roundName = this.getRoundName(this.tournament.getCurrentRoundNumber(), this.tournament.getPlayerCount());
    ctx.fillStyle = '#00ffff';
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(roundName, centerX, centerY - 120);
    
    const startY = centerY - 80;
    const matchHeight = 40;
    
    currentRound.matches.forEach((match, index) => {
      const y = startY + index * matchHeight;
      this.drawMatch(ctx, match, centerX, y);
    });
  }

  private drawMatch(ctx: CanvasRenderingContext2D, match: TournamentMatch, centerX: number, y: number): void
  {
    const matchWidth = 400;
    const matchX = centerX - matchWidth / 2;
    
    ctx.fillStyle = '#111111';
    ctx.fillRect(matchX, y, matchWidth, 35);
    
    const isNextMatch = this.tournament.getNextMatch()?.id === match.id;
    ctx.strokeStyle = isNextMatch ? '#00ff00' : (match.winner ? '#00ffff' : '#444444');
    ctx.lineWidth = isNextMatch ? 3 : 2;
    ctx.strokeRect(matchX, y, matchWidth, 35);
    
    ctx.textAlign = 'left';
    ctx.font = '16px monospace';
    
    ctx.fillStyle = match.winner?.alias === match.player1.alias ? '#00ff00' : '#ffffff';
    ctx.fillText(match.player1.alias, matchX + 10, y + 22);
    
    ctx.fillStyle = '#888888';
    ctx.textAlign = 'center';
    if (match.player2 === null)
      ctx.fillText('(BYE)', centerX, y + 22);
    else
    {
      ctx.fillText('VS', centerX, y + 22);
      
      ctx.textAlign = 'right';
      ctx.fillStyle = match.winner?.alias === match.player2.alias ? '#00ff00' : '#ffffff';
      ctx.fillText(match.player2.alias, matchX + matchWidth - 10, y + 22);
    }
  }

  private getRoundName(roundNumber: number, totalPlayers: number): string
  {
    const totalRounds = Math.ceil(Math.log2(totalPlayers));
    const remainingRounds = totalRounds - roundNumber;
    
    if (remainingRounds === 0)
      return 'FINAL';
    else if (remainingRounds === 1)
      return 'SEMI-FINAL';
    else if (remainingRounds === 2)
      return 'QUARTER-FINAL';
    else
      return `ROUND ${roundNumber + 1}`;
  }

  public draw(): void
  {
    const ctx = this.ctx;
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    
    ctx.fillStyle = GAME_CONFIG.CANVAS.BACKGROUND_COLOR;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    UIHelpers.drawTitle(ctx, 'TOURNAMENT BRACKET', centerX, centerY - 200, GAME_CONFIG.MENU.DEFAULT_COLOR, 36);
    
    MenuHelpers.drawBreadcrumb(ctx, 'MENU > TOURNAMENT > BRACKET', centerX, centerY - 150);
    
    if (this.tournament.isTournamentComplete())
    {
      const winner = this.tournament.getTournamentWinner();
      
      ctx.fillStyle = '#00ff00';
      ctx.font = 'bold 32px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('TOURNAMENT COMPLETE!', centerX, centerY - 50);
      
      ctx.fillStyle = '#00ffff';
      ctx.font = 'bold 28px monospace';
      ctx.fillText(`Winner: ${winner?.alias}`, centerX, centerY + 10);
      
      UIHelpers.drawButton(ctx, 'EXIT', this.exitButtonBounds.x, this.exitButtonBounds.y, this.exitButtonBounds.width, this.exitButtonBounds.height, '#ff0000', this.hoveredButton === 'exit');
      
      MenuHelpers.drawMenuHint(ctx, 'Press ESC or click EXIT to return to menu', centerX, centerY + 320, GAME_CONFIG.MENU.HINT_COLOR, GAME_CONFIG.MENU.HINT_FONT_SIZE);
    }
    else
    {
      this.drawMatches();
      
      const nextMatch = this.tournament.getNextMatch();
      
      if (nextMatch)
      {
        UIHelpers.drawButton(ctx, 'PLAY MATCH', this.playButtonBounds.x, this.playButtonBounds.y, this.playButtonBounds.width, this.playButtonBounds.height, '#00ff00', this.hoveredButton === 'play');
        MenuHelpers.drawMenuHint(ctx, 'Press ENTER or click PLAY MATCH | ESC to exit', centerX, centerY + 320, GAME_CONFIG.MENU.HINT_COLOR, GAME_CONFIG.MENU.HINT_FONT_SIZE);
      }
      
      UIHelpers.drawButton(ctx, 'EXIT', this.exitButtonBounds.x, this.exitButtonBounds.y, this.exitButtonBounds.width, this.exitButtonBounds.height, '#ff0000', this.hoveredButton === 'exit');
    }
  }

  public resize(): void
  {
    this.updateButtonBounds();
  }

  public updateTournament(tournament: Tournament): void
  {
    this.tournament = tournament;
  }
}
