import { UIHelpers } from '../utils/UIHelpers';
import { GAME_CONFIG } from '../games/config/config';

export type MenuState = 'main' | 'play' | 'pong' | 'pacman' | 'pongCustomize';

interface UserInfo
{
  username: string;
  wins: number;
  losses: number;
}

interface MenuButton
{
  label: string;
  action: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

export class MenuScreen 
{
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  
  private menuState: MenuState = 'main';
  private buttons: MenuButton[] = [];
  private hoveredButton: MenuButton | null = null;
  
  private userInfo: UserInfo | null = null;
  
  private mouseMoveHandler: (e: MouseEvent) => void;
  private clickHandler: (e: MouseEvent) => void;
  private keyDownHandler: (e: KeyboardEvent) => void;
  
  private onAction: (action: string) => void;
  
  constructor(canvas: HTMLCanvasElement, userInfo: UserInfo | null, onAction: (action: string) => void)
  {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.userInfo = userInfo;
    this.onAction = onAction;
    
    this.mouseMoveHandler = (e: MouseEvent) => this.handleMouseMove(e);
    this.clickHandler = (e: MouseEvent) => this.handleClick(e);
    this.keyDownHandler = (e: KeyboardEvent) => this.handleKeyDown(e);
    
    this.setupEventListeners();
    this.createButtons();
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
  
  public setMenuState(state: MenuState): void
  {
    this.menuState = state;
    this.createButtons();
  }
  
  
  public getMenuState(): MenuState
  {
    return this.menuState;
  }
  
  
  public setUserInfo(userInfo: UserInfo | null): void
  {
    this.userInfo = userInfo;
  }
  
  
  private createButtons(): void
  {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    const buttonWidth = 300;
    const buttonHeight = 60;
    const spacing = 20;
    
    let buttonLabels: Array<{ label: string; action: string }> = [];
    
    switch (this.menuState)
    {
      case 'main':
        buttonLabels = [
          { label: 'PLAY', action: 'play' },
          { label: 'TOURNAMENT', action: 'tournament' },
          { label: 'PROFILE', action: 'profile' },
          { label: 'LOGOUT', action: 'logout' }
        ];
        break;
        
      case 'play':
        buttonLabels = [
          { label: 'PONG', action: 'pong' },
          { label: 'PAC-MAN', action: 'pacman' },
          { label: 'BACK', action: 'back' }
        ];
        break;
        
      case 'pong':
        buttonLabels = [
          { label: 'SOLO', action: 'pong-solo' },
          { label: 'DUO', action: 'pong-duo' },
          { label: 'CUSTOMIZE', action: 'pong-customize' },
          { label: 'BACK', action: 'back' }
        ];
        break;
        
      case 'pacman':
        buttonLabels = [
          { label: 'SOLO', action: 'pacman-solo' },
          { label: 'DUO', action: 'pacman-duo' },
          { label: 'CUSTOMIZE', action: 'pacman-customize' },
          { label: 'BACK', action: 'back' }
        ];
        break;
        
      case 'pongCustomize':
        buttonLabels = [];
        break;
    }
    
    const totalHeight = buttonLabels.length * buttonHeight + (buttonLabels.length - 1) * spacing;
    let currentY = centerY - totalHeight / 2;
    
    this.buttons = buttonLabels.map(config => {
      const button = {label: config.label, action: config.action, x: centerX - buttonWidth / 2, y: currentY, width: buttonWidth, height: buttonHeight, color: '#00ffff'};
      currentY += buttonHeight + spacing;
      return button;
    });
  }
  
  private handleMouseMove(e: MouseEvent): void
  {
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    this.hoveredButton = null;
    
    for (const button of this.buttons)
    {
      if (UIHelpers.isInBounds(mouseX, mouseY, button))
      {
        this.hoveredButton = button;
        break;
      }
    }
    
    this.canvas.style.cursor = this.hoveredButton ? 'pointer' : 'default';
  }
  
  private handleClick(e: MouseEvent): void
  {
    if (this.hoveredButton)
      this.onAction(this.hoveredButton.action);
  }
  
  private handleKeyDown(e: KeyboardEvent): void
  {
    if (e.key >= '1' && e.key <= '9')
    {
      const index = parseInt(e.key) - 1;
      if (index < this.buttons.length)
        this.onAction(this.buttons[index].action);
    }
    else if (e.key === 'Escape')
      this.onAction('back');
    else if (e.key.toLowerCase() === 'l' && this.menuState === 'main')
      this.onAction('logout');
  }
  
  
  private getBreadcrumb(): string
  {
    if (this.menuState === 'play')
      return 'MENU > PLAY';
    else if (this.menuState === 'pong')
      return 'MENU > PLAY > PONG';
    else if (this.menuState === 'pacman')
      return 'MENU > PLAY > PAC-MAN';
    else if (this.menuState === 'pongCustomize')
      return 'MENU > PLAY > PONG > CUSTOMIZE';
    
    return 'MENU';
  }
  
  private getHint(): string
  {
    let hint = 'Press numbers or click to select';
    if (this.menuState !== 'main')
      hint += ' | ESC to go back';
    return hint;
  }
  
  public draw(): void
  {
    const ctx = this.ctx;
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    
    ctx.fillStyle = GAME_CONFIG.CANVAS.BACKGROUND_COLOR;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    UIHelpers.drawTitle(ctx, GAME_CONFIG.MENU.TITLE, centerX, centerY - 280, GAME_CONFIG.MENU.DEFAULT_COLOR, GAME_CONFIG.MENU.TITLE_FONT_SIZE);
    
    if (this.userInfo)
    {
      ctx.fillStyle = '#00ffff';
      ctx.font = '24px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`Welcome, ${this.userInfo.username}`, centerX, centerY - 220);
    }
    
    if (this.menuState !== 'main')
    {
      ctx.fillStyle = '#888888';
      ctx.font = '16px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(this.getBreadcrumb(), centerX, centerY - 180);
    }
    
    for (const button of this.buttons)
    {
      const isHovered = button === this.hoveredButton;
      UIHelpers.drawButton(ctx, button.label, button.x, button.y, button.width, button.height, button.color, isHovered);
    }
    
    ctx.fillStyle = GAME_CONFIG.MENU.HINT_COLOR;
    ctx.font = `${GAME_CONFIG.MENU.HINT_FONT_SIZE}px monospace`;
    ctx.textAlign = 'center';
    ctx.fillText(this.getHint(), centerX, this.canvas.height - 40);
  }
  
  public resize(): void
  {
    this.createButtons();
  }
}
