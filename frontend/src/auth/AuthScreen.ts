import { BaseAuthScreen } from './BaseAuthScreen';
import { AuthService } from './AuthService';
import { UIHelpers } from '../utils/UIHelpers';

interface User
{
  id: number;
  username: string;
  email: string;
  avatar: string;
  wins: number;
  losses: number;
}

export class AuthScreen extends BaseAuthScreen
{
  private mode: 'login' | 'register' = 'login';
  private username: string = '';
  private activeFieldRegister: 'login' | 'username' | 'password' = 'login';

  protected calculatePositions(): void
  {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    
    this.buttons.set('submit', {x: centerX - 100, y: centerY + 120, width: 200, height: 50});
    this.buttons.set('toggle', {x: centerX - 100, y: centerY + 190, width: 200, height: 40});
  }

  protected switchField(): void
  {
    if (this.mode === 'register')
    {
      if (this.activeFieldRegister === 'login')
        this.activeFieldRegister = 'username';
      else if (this.activeFieldRegister === 'username')
        this.activeFieldRegister = 'password';
      else
        this.activeFieldRegister = 'login';
    }
    else
      super.switchField();
  }

  protected handleTextInput(key: string): void
  {
    const currentField = this.mode === 'register' ? this.activeFieldRegister : this.activeField;
    
    if (key === 'Backspace')
    {
      if (currentField === 'login')
        this.login = this.login.slice(0, -1);
      else if (currentField === 'username')
        this.username = this.username.slice(0, -1);
      else
        this.password = this.password.slice(0, -1);
    }
    else if (key.length === 1)
    {
      const isValid = currentField === 'password' || UIHelpers.isValidInputChar(key);
      if (isValid)
      {
        if (currentField === 'login')
          this.login += key;
        else if (currentField === 'username')
          this.username += key;
        else
          this.password += key;
      }
    }
  }

  protected handleButtonClick(buttonName: string): void
  {
    if (buttonName === 'submit')
      this.handleSubmit();
    else if (buttonName === 'toggle')
      this.toggleMode();
  }

  protected handleFieldClick(mouseY: number): void
  {
    const centerY = this.canvas.height / 2;
    
    if (this.mode === 'register')
    {
      if (mouseY >= centerY - 80 && mouseY <= centerY - 30)
        this.activeFieldRegister = 'login';
      else if (mouseY >= centerY - 20 && mouseY <= centerY + 30)
        this.activeFieldRegister = 'username';
      else if (mouseY >= centerY + 40 && mouseY <= centerY + 90)
        this.activeFieldRegister = 'password';
    }
    else
    {
      if (mouseY >= centerY - 80 && mouseY <= centerY - 30)
        this.activeField = 'login';
      else if (mouseY >= centerY - 20 && mouseY <= centerY + 30)
        this.activeField = 'password';
    }
  }

  private toggleMode(): void
  {
    this.mode = this.mode === 'login' ? 'register' : 'login';
    this.error = '';
    this.login = '';
    this.username = '';
    this.password = '';
    this.activeField = 'login';
    this.activeFieldRegister = 'login';
  }

  protected async handleSubmit(): Promise<void>
  {
    if (!this.checkCooldown())
      return;
    
    this.error = '';
    
    if (!this.login || !this.password)
    {
      this.error = 'Login and password are required';
      return;
    }

    if (!UIHelpers.isValidEmail(this.login))
    {
      this.error = 'Please enter a valid email address';
      return;
    }

    if (this.mode === 'register')
    {
      if (!this.username)
      {
        this.error = 'Username is required';
        return;
      }
      
      if (this.username.length < 3)
      {
        this.error = 'Username must be at least 3 characters';
        return;
      }
    }
    
    if (this.password.length < 4)
    {
      this.error = 'Password must be at least 4 characters';
      return;
    }
    
    this.loading = true;
    
    try
    {
      let user: User;
      
      if (this.mode === 'register')
        user = await AuthService.register(this.login.trim(), this.username.trim(), this.password);
      else
        user = await AuthService.login(this.login.trim(), this.password);
      
      if (user && user.id)
        window.dispatchEvent(new CustomEvent('auth-success', { detail: user }));
      else
        throw new Error('Invalid user data');
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
    
    UIHelpers.drawTitle(this.ctx, 'TRANSCENDENCE', centerX, centerY - 180, '#ffffff', 48);
    
    this.ctx.fillStyle = '#00ffff';
    this.ctx.font = '24px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(this.mode === 'login' ? 'LOGIN' : 'REGISTER', centerX, centerY - 130);
    
    if (this.mode === 'register')
      this.drawRegisterFields(centerX, centerY);
    else
      this.drawLoginFields(centerX, centerY);
    
    const submitBtn = this.buttons.get('submit')!;
    UIHelpers.drawButton(this.ctx, this.mode === 'login' ? 'LOGIN' : 'REGISTER', submitBtn.x, submitBtn.y, submitBtn.width, submitBtn.height, '#00ffff', this.hoveredButton === 'submit');
    
    const toggleBtn = this.buttons.get('toggle')!;
    UIHelpers.drawButton(this.ctx, this.mode === 'login' ? 'Need an account?' : 'Have an account?', toggleBtn.x, toggleBtn.y, toggleBtn.width, toggleBtn.height, '#888888', this.hoveredButton === 'toggle');
    
    if (!this.loading)
      UIHelpers.drawHint(this.ctx, 'Tab to switch fields | Enter to submit', centerX, centerY + 320);
  }
  
  private drawLoginFields(centerX: number, centerY: number): void
  {
    UIHelpers.drawField(this.ctx, 'Email', this.login, centerX - 200, centerY - 80, 400, 40, this.activeField === 'login');
    UIHelpers.drawField(this.ctx, 'Password', '*'.repeat(this.password.length), centerX - 200, centerY - 10, 400, 40, this.activeField === 'password');
  }
  
  private drawRegisterFields(centerX: number, centerY: number): void
  {
    UIHelpers.drawField(this.ctx, 'Email', this.login, centerX - 200, centerY - 80, 400, 40, this.activeFieldRegister === 'login');
    UIHelpers.drawField(this.ctx, 'Username', this.username, centerX - 200, centerY - 10, 400, 40, this.activeFieldRegister === 'username');
    UIHelpers.drawField(this.ctx, 'Password', '*'.repeat(this.password.length), centerX - 200, centerY + 60, 400, 40, this.activeFieldRegister === 'password');
  }
}