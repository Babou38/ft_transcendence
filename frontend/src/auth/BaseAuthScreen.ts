import { UIHelpers } from '../utils/UIHelpers';

export abstract class BaseAuthScreen
{
  protected canvas: HTMLCanvasElement;
  protected ctx: CanvasRenderingContext2D;
  
  protected login: string = '';
  protected password: string = '';
  protected activeField: 'login' | 'password' = 'login';
  protected error: string = '';
  protected loading: boolean = false;
  
  protected buttons: Map<string, { x: number; y: number; width: number; height: number }> = new Map();
  protected hoveredButton: string | null = null;
  
  protected lastSubmitTime: number = 0;
  protected submitCooldown: number = 1000;
  protected pressedKeys: Set<string> = new Set();
  
  protected keyDownHandler: (e: KeyboardEvent) => void;
  protected keyUpHandler: (e: KeyboardEvent) => void;
  protected clickHandler: (e: MouseEvent) => void;
  protected mouseMoveHandler: (e: MouseEvent) => void;

  constructor(canvas: HTMLCanvasElement)
  {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    
    this.keyDownHandler = (e: KeyboardEvent) => this.handleKeyDown(e);
    this.keyUpHandler = (e: KeyboardEvent) => this.pressedKeys.delete(e.key);
    this.clickHandler = (e: MouseEvent) => this.handleClick(e);
    this.mouseMoveHandler = (e: MouseEvent) => this.handleMouseMove(e);
    
    this.calculatePositions();
    this.setupEventListeners();
  }

  
  protected abstract calculatePositions(): void;

  protected abstract handleSubmit(): Promise<void>;

  protected abstract drawContent(): void;

  protected setupEventListeners(): void
  {
    window.addEventListener('keydown', this.keyDownHandler);
    window.addEventListener('keyup', this.keyUpHandler);
    this.canvas.addEventListener('click', this.clickHandler);
    this.canvas.addEventListener('mousemove', this.mouseMoveHandler);
  }

  public cleanup(): void
  {
    window.removeEventListener('keydown', this.keyDownHandler);
    window.removeEventListener('keyup', this.keyUpHandler);
    this.canvas.removeEventListener('click', this.clickHandler);
    this.canvas.removeEventListener('mousemove', this.mouseMoveHandler);
  }

  protected handleKeyDown(e: KeyboardEvent): void
  {
    if (this.loading)
      return;
    
    if (this.pressedKeys.has(e.key))
      return;
    this.pressedKeys.add(e.key);
    
    if (e.key === 'Tab')
    {
      e.preventDefault();
      this.switchField();
      return;
    }
    
    if (e.key === 'Enter')
    {
      e.preventDefault();
      this.handleSubmit();
      return;
    }
    
    this.handleTextInput(e.key);
  }

  protected handleTextInput(key: string): void
  {
    if (key === 'Backspace')
    {
      if (this.activeField === 'login')
        this.login = this.login.slice(0, -1);
      else
        this.password = this.password.slice(0, -1);
    }
    else if (key.length === 1 && UIHelpers.isValidInputChar(key))
    {
      if (this.activeField === 'login')
        this.login += key;
      else
        this.password += key;
    }
  }

  protected switchField(): void
  {
    this.activeField = this.activeField === 'login' ? 'password' : 'login';
  }

  protected handleClick(e: MouseEvent): void
  {
    if (this.loading)
      return;
    
    const { mouseX, mouseY } = this.getMousePosition(e);
    
    for (const [name, bounds] of this.buttons)
    {
      if (UIHelpers.isInBounds(mouseX, mouseY, bounds))
      {
        this.handleButtonClick(name);
        return;
      }
    }
    
    this.handleFieldClick(mouseY);
  }

  protected abstract handleButtonClick(buttonName: string): void;

  protected handleMouseMove(e: MouseEvent): void
  {
    if (this.loading)
      return;
    
    const { mouseX, mouseY } = this.getMousePosition(e);
    
    this.hoveredButton = null;
    
    for (const [name, bounds] of this.buttons)
    {
      if (UIHelpers.isInBounds(mouseX, mouseY, bounds))
      {
        this.hoveredButton = name;
        break;
      }
    }
    
    this.canvas.style.cursor = this.hoveredButton ? 'pointer' : 'default';
  }

  protected getMousePosition(e: MouseEvent): { mouseX: number; mouseY: number }
  {
    const rect = this.canvas.getBoundingClientRect();
    return {mouseX: e.clientX - rect.left, mouseY: e.clientY - rect.top};
  }

  protected handleFieldClick(mouseY: number): void
  {
    const centerY = this.canvas.height / 2;
    const fieldHeight = 50;
    
    if (mouseY >= centerY - 80 && mouseY <= centerY - 30)
      this.activeField = 'login';
    else if (mouseY >= centerY - 20 && mouseY <= centerY + 30)
      this.activeField = 'password';
  }

  protected validateFields(): boolean
  {
    if (!this.login || !this.password)
    {
      this.error = 'Login and password are required';
      return false;
    }
    
    if (this.password.length < 4)
    {
      this.error = 'Password must be at least 4 characters';
      return false;
    }
    
    return true;
  }

  protected checkCooldown(): boolean
  {
    const now = Date.now();
    if (now - this.lastSubmitTime < this.submitCooldown)
      return false;
    this.lastSubmitTime = now;
    return true;
  }

  public draw(): void
  {
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.drawContent();
    
    if (this.error)
      UIHelpers.drawError(this.ctx, this.error, this.canvas.width / 2, this.canvas.height / 2 + 200);
    
    if (this.loading)
      UIHelpers.drawLoading(this.ctx, 'Loading', this.canvas.width / 2, this.canvas.height / 2 + 230);
  }

  protected drawFields(startY: number): void
  {
    const centerX = this.canvas.width / 2;
    
    UIHelpers.drawField(this.ctx, 'email', this.login, centerX - 200, startY, 400, 40, this.activeField === 'login');
    UIHelpers.drawField(this.ctx, 'Password', '*'.repeat(this.password.length), centerX - 200, startY + 60, 400, 40, this.activeField === 'password');
  }

  
  public resize(): void
  {
    this.calculatePositions();
  }
}