import { BaseAuthScreen } from './BaseAuthScreen';
import { AuthService } from './AuthService';
import { UIHelpers } from '../utils/UIHelpers';

const API_URL = import.meta.env.VITE_API_URL || 'https://localhost:8443';

interface Player2Info
{
  id: number;
  username: string;
  email: string;
  avatar: string;
  wins: number;
  losses: number;
}

export class Player2AuthScreen extends BaseAuthScreen
{
  constructor(canvas: HTMLCanvasElement, private onSuccess: (player2: Player2Info) => void, private onSkip: () => void)
  {
    super(canvas);
  }

  protected calculatePositions(): void
  {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    
    this.buttons.set('login', {x: centerX - 220, y: centerY + 120, width: 200, height: 50});
    this.buttons.set('skip', {x: centerX + 20, y: centerY + 120, width: 200, height: 50});
  }

  protected handleKeyDown(e: KeyboardEvent): void
  {
    if (e.key === 'Escape')
    {
      this.cleanup();
      this.onSkip();
      return;
    }
    
    super.handleKeyDown(e);
  }

  protected handleButtonClick(buttonName: string): void
  {
    if (buttonName === 'login')
      this.handleSubmit();
    else if (buttonName === 'skip')
    {
      this.cleanup();
      this.onSkip();
    }
  }

  protected async handleSubmit(): Promise<void>
  {
    this.error = '';
    
    if (!this.validateFields())
      return;
    
    this.loading = true;
    
    try
    {
      const response = await fetch(`${API_URL}/api/auth/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: this.login.trim(),
          password: this.password
        })
      });
      
      if (!response.ok)
      {
        const error = await response.json();
        throw new Error(error.error || 'Authentication failed');
      }
      
      const data = await response.json();
      
      const currentUser = AuthService.getCurrentUser();
      if (currentUser && currentUser.id === data.user.id)
      {
        this.error = 'You cannot play against yourself!';
        this.loading = false;
        return;
      }
      
      this.cleanup();
      this.onSuccess(data.user);
    }
    catch (err: any)
    {
      this.error = err.message || 'Authentication failed';
      this.loading = false;
    }
  }

  protected drawContent(): void
  {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '40px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('PLAYER 2 LOGIN', centerX, centerY - 160);
    
    this.ctx.fillStyle = '#888888';
    this.ctx.font = '18px monospace';
    this.ctx.fillText('(Login to save your game stats)', centerX, centerY - 120);
    
    UIHelpers.drawField(this.ctx, 'Login', this.login, centerX - 200, centerY - 80, 400, 40, this.activeField === 'login');
    UIHelpers.drawField(this.ctx, 'Password', '*'.repeat(this.password.length), centerX - 200, centerY - 20, 400, 40, this.activeField === 'password');
    
    const loginBtn = this.buttons.get('login')!;
    UIHelpers.drawButton(this.ctx, 'LOGIN', loginBtn.x, loginBtn.y, loginBtn.width, loginBtn.height, this.hoveredButton === 'login' ? '#00ffff' : '#666666', this.hoveredButton === 'login');
    
    const skipBtn = this.buttons.get('skip')!;
    UIHelpers.drawButton(this.ctx, 'SKIP (Guest)', skipBtn.x, skipBtn.y, skipBtn.width, skipBtn.height, this.hoveredButton === 'skip' ? '#ffaa00' : '#666666', this.hoveredButton === 'skip');
    
    if (!this.loading)
      UIHelpers.drawHint(this.ctx, 'Tab to switch | Enter to login | ESC to skip', centerX, centerY + 260);
  }
}