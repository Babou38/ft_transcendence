import { UIHelpers } from '../utils/UIHelpers';
import { MenuHelpers } from '../utils/MenuHelpers';
import { GAME_CONFIG } from '../games/config/config';
import { AuthService } from '../auth/AuthService';

export interface TournamentPlayer
{
  alias: string;
  userId?: number;
  isGuest: boolean;
}

type AddPlayerMode = 'choose' | 'guest' | 'login';

export class TournamentAddPlayerScreen
{
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  
  private mode: AddPlayerMode = 'choose';
  
  private guestAlias: string = '';
  private isAliasInputActive: boolean = false;
  
  private email: string = '';
  private password: string = '';
  private activeField: 'email' | 'password' | null = null;
  private isLoading: boolean = false;
  private errorMessage: string = '';
  
  private guestButtonBounds = { x: 0, y: 0, width: 200, height: 60 };
  private loginButtonBounds = { x: 0, y: 0, width: 200, height: 60 };
  private submitButtonBounds = { x: 0, y: 0, width: 200, height: 50 };
  private backButtonBounds = { x: 0, y: 0, width: 200, height: 50 };
  
  private hoveredButton: 'guest' | 'login' | 'submit' | 'back' | null = null;
  
  private mouseMoveHandler: (e: MouseEvent) => void;
  private clickHandler: (e: MouseEvent) => void;
  private keyDownHandler: (e: KeyboardEvent) => void;
  
  private onPlayerAdded: (player: TournamentPlayer) => void;
  private onBack: () => void;
  
  private existingAliases: string[];

  constructor(canvas: HTMLCanvasElement, existingAliases: string[], onPlayerAdded: (player: TournamentPlayer) => void, onBack: () => void)
  {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.existingAliases = existingAliases;
    this.onPlayerAdded = onPlayerAdded;
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
    
    this.guestButtonBounds = {x: centerX - 100, y: centerY - 50, width: 200, height: 60};
    this.loginButtonBounds = {x: centerX - 100, y: centerY + 30, width: 200, height: 60};
    
    this.submitButtonBounds = {x: centerX - 100, y: centerY + 150, width: 200, height: 50};
    this.backButtonBounds = {x: centerX - 100, y: centerY + 220, width: 200, height: 50};
  }

  private handleMouseMove(e: MouseEvent): void
  {
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    this.hoveredButton = null;
    
    if (this.mode === 'choose')
    {
      if (UIHelpers.isInBounds(mouseX, mouseY, this.guestButtonBounds))
        this.hoveredButton = 'guest';
      else if (UIHelpers.isInBounds(mouseX, mouseY, this.loginButtonBounds))
        this.hoveredButton = 'login';
      else if (UIHelpers.isInBounds(mouseX, mouseY, this.backButtonBounds))
        this.hoveredButton = 'back';
    }
    else
    {
      if (UIHelpers.isInBounds(mouseX, mouseY, this.submitButtonBounds))
        this.hoveredButton = 'submit';
      else if (UIHelpers.isInBounds(mouseX, mouseY, this.backButtonBounds))
        this.hoveredButton = 'back';
    }
    
    this.canvas.style.cursor = this.hoveredButton ? 'pointer' : 'default';
  }

  private handleClick(e: MouseEvent): void
  {
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    if (this.mode === 'choose')
    {
      if (UIHelpers.isInBounds(mouseX, mouseY, this.guestButtonBounds))
      {
        this.mode = 'guest';
        this.isAliasInputActive = true;
      }
      else if (UIHelpers.isInBounds(mouseX, mouseY, this.loginButtonBounds))
      {
        this.mode = 'login';
        this.activeField = 'email';
      }
      else if (UIHelpers.isInBounds(mouseX, mouseY, this.backButtonBounds))
        this.onBack();
    }
    else if (this.mode === 'guest')
    {
      const centerX = this.canvas.width / 2;
      const centerY = this.canvas.height / 2;
      const inputBounds = { x: centerX - 150, y: centerY - 50, width: 300, height: 40 };
      
      if (UIHelpers.isInBounds(mouseX, mouseY, inputBounds))
        this.isAliasInputActive = true;
      else if (UIHelpers.isInBounds(mouseX, mouseY, this.submitButtonBounds))
        this.submitGuest();
      else if (UIHelpers.isInBounds(mouseX, mouseY, this.backButtonBounds))
      {
        this.mode = 'choose';
        this.guestAlias = '';
        this.errorMessage = '';
      }
      else
        this.isAliasInputActive = false;
    }
    else if (this.mode === 'login')
    {
      const centerX = this.canvas.width / 2;
      const centerY = this.canvas.height / 2;
      const emailBounds = { x: centerX - 150, y: centerY - 80, width: 300, height: 40 };
      const passwordBounds = { x: centerX - 150, y: centerY, width: 300, height: 40 };
      
      if (UIHelpers.isInBounds(mouseX, mouseY, emailBounds))
        this.activeField = 'email';
      else if (UIHelpers.isInBounds(mouseX, mouseY, passwordBounds))
        this.activeField = 'password';
      else if (UIHelpers.isInBounds(mouseX, mouseY, this.submitButtonBounds))
        this.submitLogin();
      else if (UIHelpers.isInBounds(mouseX, mouseY, this.backButtonBounds))
      {
        this.mode = 'choose';
        this.email = '';
        this.password = '';
        this.errorMessage = '';
        this.activeField = null;
      }
      else
        this.activeField = null;
    }
  }

  private handleKeyDown(e: KeyboardEvent): void
  {
    if (e.key === 'Escape')
    {
      if (this.mode === 'choose')
        this.onBack();
      else
      {
        this.mode = 'choose';
        this.guestAlias = '';
        this.email = '';
        this.password = '';
        this.errorMessage = '';
        this.activeField = null;
        this.isAliasInputActive = false;
      }
      return;
    }
    
    if (this.mode === 'guest' && this.isAliasInputActive)
    {
      if (e.key === 'Enter' && this.guestAlias.trim())
        this.submitGuest();
      else if (e.key === 'Backspace')
        this.guestAlias = this.guestAlias.slice(0, -1);
      else if (e.key.length === 1 && /[a-zA-Z0-9\s\-_]/.test(e.key) && this.guestAlias.length < 20)
        this.guestAlias += e.key;
    }
    else if (this.mode === 'login' && this.activeField)
    {
      if (e.key === 'Enter')
      {
        if (this.activeField === 'email')
          this.activeField = 'password';
        else
          this.submitLogin();
      }
      else if (e.key === 'Tab')
      {
        e.preventDefault();
        this.activeField = this.activeField === 'email' ? 'password' : 'email';
      }
      else if (e.key === 'Backspace')
      {
        if (this.activeField === 'email')
          this.email = this.email.slice(0, -1);
        else
          this.password = this.password.slice(0, -1);
      }
      else if (e.key.length === 1 && UIHelpers.isValidInputChar(e.key))
      {
        if (this.activeField === 'email' && this.email.length < 50)
          this.email += e.key;
        else if (this.activeField === 'password' && this.password.length < 50)
          this.password += e.key;
      }
    }
  }

  private submitGuest(): void
  {
    const alias = this.guestAlias.trim();
    
    if (!alias)
    {
      this.errorMessage = 'Please enter a name';
      return;
    }
    
    if (this.existingAliases.includes(alias))
    {
      this.errorMessage = `Player "${alias}" already added`;
      return;
    }
    
    this.onPlayerAdded({alias: alias, isGuest: true});
  }

  private async submitLogin(): Promise<void>
  {
    if (!this.email.trim() || !this.password.trim())
    {
      this.errorMessage = 'Please fill all fields';
      return;
    }
    
    
    this.isLoading = true;
    this.errorMessage = '';
    
    try
    {
      const result = await AuthService.verifyCredentials(this.email, this.password);
      
      if (result.success && result.user)
      {
        if (this.existingAliases.includes(result.user.username))
        {
          this.errorMessage = `Player "${result.user.username}" already added`;
          this.isLoading = false;
          return;
        }
        
        this.onPlayerAdded({alias: result.user.username, userId: result.user.id, isGuest: false});
      }
      else
      {
        this.errorMessage = result.error || 'Invalid credentials';
        this.isLoading = false;
      }
    }
    catch (error)
    {
      this.errorMessage = 'Connection error';
      this.isLoading = false;
    }
  }

  public draw(): void
  {
    const ctx = this.ctx;
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    
    ctx.fillStyle = GAME_CONFIG.CANVAS.BACKGROUND_COLOR;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    UIHelpers.drawTitle(ctx, 'ADD PLAYER', centerX, centerY - 200, GAME_CONFIG.MENU.DEFAULT_COLOR, 36);
    
    MenuHelpers.drawBreadcrumb(ctx, 'MENU > TOURNAMENT > ADD PLAYER', centerX, centerY - 150);
    
    if (this.mode === 'choose')
      this.drawChooseMode(ctx, centerX, centerY);
    else if (this.mode === 'guest')
      this.drawGuestMode(ctx, centerX, centerY);
    else if (this.mode === 'login')
      this.drawLoginMode(ctx, centerX, centerY);
  }

  private drawChooseMode(ctx: CanvasRenderingContext2D, centerX: number, centerY: number): void
  {
    ctx.fillStyle = '#888888';
    ctx.font = '18px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Choose player type:', centerX, centerY - 100);
    
    UIHelpers.drawButton(ctx, 'GUEST', this.guestButtonBounds.x, this.guestButtonBounds.y, this.guestButtonBounds.width, this.guestButtonBounds.height, '#00ffff', this.hoveredButton === 'guest');
    
    ctx.fillStyle = '#666666';
    ctx.font = '14px monospace';
    ctx.fillText('(No stats saved)', centerX, centerY - 50 + 75);
    
    UIHelpers.drawButton(ctx, 'LOGIN', this.loginButtonBounds.x, this.loginButtonBounds.y, this.loginButtonBounds.width, this.loginButtonBounds.height, '#00ff00', this.hoveredButton === 'login');
    
    ctx.fillStyle = '#666666';
    ctx.fillText('(Stats will be saved)', centerX, centerY + 30 + 75);
    
    UIHelpers.drawButton(ctx, 'BACK', this.backButtonBounds.x, this.backButtonBounds.y, this.backButtonBounds.width, this.backButtonBounds.height, '#ff0000', this.hoveredButton === 'back');
    
    MenuHelpers.drawMenuHint(ctx, 'Select player type or ESC to go back', centerX, centerY + 300, GAME_CONFIG.MENU.HINT_COLOR, GAME_CONFIG.MENU.HINT_FONT_SIZE);
  }

  private drawGuestMode(ctx: CanvasRenderingContext2D, centerX: number, centerY: number): void
  {
    ctx.fillStyle = '#888888';
    ctx.font = '18px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Enter player name:', centerX, centerY - 80);
    
    const inputY = centerY - 50;
    const inputX = centerX - 150;
    
    ctx.strokeStyle = this.isAliasInputActive ? '#00ffff' : '#444444';
    ctx.lineWidth = 2;
    ctx.strokeRect(inputX, inputY, 300, 40);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '18px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(this.guestAlias || '', inputX + 10, inputY + 26);
    
    if (this.isAliasInputActive && Math.floor(Date.now() / 500) % 2 === 0)
    {
      const textWidth = ctx.measureText(this.guestAlias).width;
      ctx.fillRect(inputX + 10 + textWidth, inputY + 10, 2, 20);
    }
    
    UIHelpers.drawButton(ctx, 'ADD', this.submitButtonBounds.x, this.submitButtonBounds.y, this.submitButtonBounds.width, this.submitButtonBounds.height, this.guestAlias.trim() ? '#00ff00' : '#666666', this.hoveredButton === 'submit');
    
    UIHelpers.drawButton(ctx, 'BACK', this.backButtonBounds.x, this.backButtonBounds.y, this.backButtonBounds.width, this.backButtonBounds.height, '#ff0000', this.hoveredButton === 'back');
    
    if (this.errorMessage)
      UIHelpers.drawError(ctx, this.errorMessage, centerX, centerY + 290);
    
    MenuHelpers.drawMenuHint(ctx, 'Type name and press ENTER | ESC to go back', centerX, centerY + 320, GAME_CONFIG.MENU.HINT_COLOR, GAME_CONFIG.MENU.HINT_FONT_SIZE);
  }

  private drawLoginMode(ctx: CanvasRenderingContext2D, centerX: number, centerY: number): void
  {
    if (this.isLoading)
    {
      UIHelpers.drawLoading(ctx, 'Verifying credentials', centerX, centerY);
      return;
    }
    
    ctx.fillStyle = '#888888';
    ctx.font = '18px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Login to save stats:', centerX, centerY - 120);
    
    UIHelpers.drawField(ctx, 'Email', this.email, centerX - 150, centerY - 80, 300, 40, this.activeField === 'email');
    
    UIHelpers.drawField(ctx, 'Password', '*'.repeat(this.password.length), centerX - 150, centerY, 300, 40, this.activeField === 'password');
    
    UIHelpers.drawButton(ctx, 'LOGIN', this.submitButtonBounds.x, this.submitButtonBounds.y, this.submitButtonBounds.width, this.submitButtonBounds.height, this.email.trim() && this.password.trim() ? '#00ff00' : '#666666', this.hoveredButton === 'submit');
    
    UIHelpers.drawButton(ctx, 'BACK', this.backButtonBounds.x, this.backButtonBounds.y, this.backButtonBounds.width, this.backButtonBounds.height, '#ff0000', this.hoveredButton === 'back');
    
    if (this.errorMessage)
      UIHelpers.drawError(ctx, this.errorMessage, centerX, centerY + 290);
    
    MenuHelpers.drawMenuHint(ctx, 'Fill fields and press ENTER | ESC to go back', centerX, centerY + 320, GAME_CONFIG.MENU.HINT_COLOR, GAME_CONFIG.MENU.HINT_FONT_SIZE);
  }

  public resize(): void
  {
    this.updateButtonBounds();
  }

  public setError(message: string): void
  {
    this.errorMessage = message;
    this.isLoading = false;
  }
}
