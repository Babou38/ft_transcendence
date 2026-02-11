import { UIHelpers } from '../utils/UIHelpers';
import { MenuHelpers } from '../utils/MenuHelpers';
import { GAME_CONFIG } from '../games/config/config';
import { TournamentPlayer } from './TournamentAddPlayerScreen';

export class TournamentScreen
{
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  
  private players: TournamentPlayer[] = [];
  private selectedGame: 'pong' | 'pacman' = 'pong';
  
  private addButtonBounds = { x: 0, y: 0, width: 200, height: 50 };
  private startButtonBounds = { x: 0, y: 0, width: 200, height: 50 };
  private backButtonBounds = { x: 0, y: 0, width: 200, height: 50 };
  private pongButtonBounds = { x: 0, y: 0, width: 150, height: 40 };
  private pacmanButtonBounds = { x: 0, y: 0, width: 150, height: 40 };
  
  private hoveredButton: 'add' | 'start' | 'back' | 'pong' | 'pacman' | null = null;
  private errorMessage: string = '';
  
  private mouseMoveHandler: (e: MouseEvent) => void;
  private clickHandler: (e: MouseEvent) => void;
  private keyDownHandler: (e: KeyboardEvent) => void;
  
  private onStartTournament: (players: TournamentPlayer[], gameType: 'pong' | 'pacman') => void;
  private onAddPlayer: () => void;
  private onBack: () => void;

  constructor(canvas: HTMLCanvasElement, onStartTournament: (players: TournamentPlayer[], gameType: 'pong' | 'pacman') => void, onAddPlayer: () => void, onBack: () => void)
  {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.onStartTournament = onStartTournament;
    this.onAddPlayer = onAddPlayer;
    this.onBack = onBack;
    
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
    
    this.pongButtonBounds = {x: centerX - 160, y: centerY - 220, width: 150, height: 40};
    this.pacmanButtonBounds = {x: centerX + 10, y: centerY - 220, width: 150, height: 40};
    this.addButtonBounds = {x: centerX - 100, y: centerY - 120, width: 200, height: 50};
    this.startButtonBounds = {x: centerX - 100, y: centerY + 220, width: 200, height: 50};
    this.backButtonBounds = {x: centerX - 100, y: centerY + 290, width: 200, height: 50};
  }

  private handleMouseMove(e: MouseEvent): void
  {
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    this.hoveredButton = null;
    
    if (UIHelpers.isInBounds(mouseX, mouseY, this.pongButtonBounds))
      this.hoveredButton = 'pong';
    else if (UIHelpers.isInBounds(mouseX, mouseY, this.pacmanButtonBounds))
      this.hoveredButton = 'pacman';
    else if (UIHelpers.isInBounds(mouseX, mouseY, this.addButtonBounds))
      this.hoveredButton = 'add';
    else if (UIHelpers.isInBounds(mouseX, mouseY, this.startButtonBounds) && this.players.length >= 2)
      this.hoveredButton = 'start';
    else if (UIHelpers.isInBounds(mouseX, mouseY, this.backButtonBounds))
      this.hoveredButton = 'back';
    
    this.canvas.style.cursor = this.hoveredButton ? 'pointer' : 'default';
  }

  private handleClick(e: MouseEvent): void
  {
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    if (UIHelpers.isInBounds(mouseX, mouseY, this.pongButtonBounds))
      this.selectedGame = 'pong';
    else if (UIHelpers.isInBounds(mouseX, mouseY, this.pacmanButtonBounds))
      this.selectedGame = 'pacman';
    else if (UIHelpers.isInBounds(mouseX, mouseY, this.addButtonBounds))
      this.onAddPlayer();
    else if (UIHelpers.isInBounds(mouseX, mouseY, this.startButtonBounds) && this.players.length >= 2)
      this.onStartTournament(this.players, this.selectedGame);
    else if (UIHelpers.isInBounds(mouseX, mouseY, this.backButtonBounds))
      this.onBack();
  }

  private handleKeyDown(e: KeyboardEvent): void
  {
    if (e.key === 'Escape')
      this.onBack();
  }

  public addPlayer(player: TournamentPlayer): { success: boolean; error?: string }
  {
    if (this.players.some(p => p.alias === player.alias))
      return { success: false, error: `Player "${player.alias}" already added` };
    
    if (this.players.length >= 16)
      return { success: false, error: 'Maximum 16 players reached' };
    
    this.players.push(player);
    return { success: true };
  }

  public getPlayerAliases(): string[]
  {
    return this.players.map(p => p.alias);
  }

  private drawPlayersList(): void
  {
    const ctx = this.ctx;
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    
    ctx.fillStyle = '#888888';
    ctx.font = '18px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('PLAYERS', centerX, centerY + 30);
    
    if (this.players.length === 0)
    {
      ctx.fillStyle = '#666666';
      ctx.font = '16px monospace';
      ctx.fillText('No players added yet', centerX, centerY + 60);
      return;
    }
    
    ctx.font = '16px monospace';
    ctx.textAlign = 'left';
    
    const startY = centerY + 55;
    const maxVisible = 4;
    const displayPlayers = this.players.slice(-maxVisible);
    
    displayPlayers.forEach((player, index) => {
      const y = startY + index * 25;
      const playerIndex = this.players.indexOf(player);
      
      ctx.fillStyle = player.isGuest ? '#00ffff' : '#00ff00';
      
      const icon = player.isGuest ? ' ' : '✓';
      ctx.fillText(`${playerIndex + 1}. ${icon} ${player.alias}`, centerX - 150, y);
    });
    
    if (this.players.length > maxVisible)
    {
      ctx.fillStyle = '#666666';
      ctx.font = '14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`... and ${this.players.length - maxVisible} more`, centerX, startY + maxVisible * 25 + 10);
    }
  }

  public draw(): void
  {
    const ctx = this.ctx;
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    
    ctx.fillStyle = GAME_CONFIG.CANVAS.BACKGROUND_COLOR;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    UIHelpers.drawTitle(ctx, 'TOURNAMENT SETUP', centerX, centerY - 280, GAME_CONFIG.MENU.DEFAULT_COLOR, 36);
    
    ctx.fillStyle = '#888888';
    ctx.textAlign = 'center';
    ctx.font = '16px monospace';
    ctx.fillText('Select Game', centerX, centerY - 235);
    
    UIHelpers.drawButton(ctx, 'PONG', this.pongButtonBounds.x, this.pongButtonBounds.y, this.pongButtonBounds.width, this.pongButtonBounds.height, this.selectedGame === 'pong' ? '#00ff00' : '#666666', this.hoveredButton === 'pong');
    UIHelpers.drawButton(ctx, 'PAC-MAN', this.pacmanButtonBounds.x, this.pacmanButtonBounds.y, this.pacmanButtonBounds.width, this.pacmanButtonBounds.height, this.selectedGame === 'pacman' ? '#00ff00' : '#666666', this.hoveredButton === 'pacman');
    MenuHelpers.drawBreadcrumb(ctx, 'MENU > TOURNAMENT', centerX, centerY - 160);
    UIHelpers.drawButton(ctx, 'ADD PLAYER', this.addButtonBounds.x, this.addButtonBounds.y, this.addButtonBounds.width, this.addButtonBounds.height, '#00ffff', this.hoveredButton === 'add');
    
    this.drawPlayersList();
    
    const canStart = this.players.length >= 2;
    UIHelpers.drawButton(ctx, 'START TOURNAMENT', this.startButtonBounds.x, this.startButtonBounds.y, this.startButtonBounds.width, this.startButtonBounds.height, canStart ? '#00ff00' : '#666666', this.hoveredButton === 'start' && canStart);
    
    UIHelpers.drawButton(ctx, 'BACK', this.backButtonBounds.x, this.backButtonBounds.y, this.backButtonBounds.width, this.backButtonBounds.height, '#ff0000', this.hoveredButton === 'back');
    
    if (this.errorMessage)
      UIHelpers.drawError(ctx, this.errorMessage, centerX, centerY + 360);
    
    let hint = 'Add at least 2 players to start';
    if (this.players.length >= 2)
      hint = 'Click START TOURNAMENT or ESC to go back';
    
    MenuHelpers.drawMenuHint(ctx, hint, centerX, centerY + 390, GAME_CONFIG.MENU.HINT_COLOR, GAME_CONFIG.MENU.HINT_FONT_SIZE);
  }

  public resize(): void
  {
    this.updateButtonBounds();
  }
}
