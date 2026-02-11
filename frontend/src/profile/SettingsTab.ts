import { UIHelpers } from "../utils/UIHelpers";
import { AuthService } from "../auth/AuthService";
import { ProfileAPI } from "./ProfileAPI";

type SettingField = 'newUsername' | 'newEmail';

interface FieldState
{
  newUsername: string;
  newEmail: string;
}

export class SettingsTab
{
  private fields: FieldState = {newUsername: '', newEmail: ''};
  
  private activeField: SettingField | null = null;
  private hoveredButton: 'updateUsername' | 'updateEmail' | null = null;
  
  private successMessage: string = '';
  private errorMessage: string = '';
  private loading: boolean = false;
  
  private messageTimer: number | null = null;
  
  private buttons = new Map<string, { x: number; y: number; width: number; height: number }>();
  
  constructor(private userId: number, private currentUsername: string, private currentEmail: string)
  {
    this.calculatePositions();
  }
  
  private calculatePositions(): void
  {
    const centerX = 640;
    const baseY = 300;
    const buttonY = baseY + 150;
    
    this.buttons.set('updateUsername', { x: centerX - 275, y: buttonY, width: 150, height: 40 });
    this.buttons.set('updateEmail', { x: centerX + 125, y: buttonY, width: 150, height: 40 });
  }
  
  updateUserInfo(username: string, email: string): void
  {
    this.currentUsername = username;
    this.currentEmail = email;
  }
  
  handleClick(mouseX: number, mouseY: number, centerX: number): boolean
  {
    for (const [name, bounds] of this.buttons)
    {
      if (UIHelpers.isInBounds(mouseX, mouseY, bounds))
      {
        this.handleButtonClick(name);
        return true;
      }
    }
    
    return this.handleFieldClickWithXY(mouseX, mouseY, centerX);
  }
  
  private handleFieldClickWithXY(mouseX: number, mouseY: number, centerX: number): boolean
  {
    const baseY = 300;
    const column = this.getClickedColumn(mouseX, centerX);
    
    if (!column)
      return false;
    
    if (column === 'username')
    {
      if (this.isInFieldBounds(mouseY, baseY + 75, 40))
      {
        this.activeField = 'newUsername';
        return true;
      }
    }
    else if (column === 'email')
    {
      if (this.isInFieldBounds(mouseY, baseY + 75, 40))
      {
        this.activeField = 'newEmail';
        return true;
      }
    }
    
    return false;
  }
  
  handleMouseMove(mouseX: number, mouseY: number): void
  {
    this.hoveredButton = null;
    
    for (const [name, bounds] of this.buttons)
    {
      if (UIHelpers.isInBounds(mouseX, mouseY, bounds))
      {
        this.hoveredButton = name as any;
        break;
      }
    }
  }
  
  handleKeyInput(key: string): void
  {
    if (!this.activeField)
      return;
    
    if (key === 'Backspace')
      this.fields[this.activeField] = this.fields[this.activeField].slice(0, -1);
    else if (key === 'Tab')
      this.switchField();
    else if (key === 'Enter')
      this.handleEnterKey();
    else if (key.length === 1)
    {
      const isPasswordField = this.activeField.toLowerCase().includes('password');
      const isValid = isPasswordField || UIHelpers.isValidInputChar(key);
      
      if (isValid && this.fields[this.activeField].length < 50)
        this.fields[this.activeField] += key;
    }
  }
  
  private switchField(): void
  {
    const fields: SettingField[] = ['newUsername', 'newEmail'];
    
    if (!this.activeField)
    {
      this.activeField = fields[0];
      return;
    }
    
    const currentIndex = fields.indexOf(this.activeField);
    const nextIndex = (currentIndex + 1) % fields.length;
    this.activeField = fields[nextIndex];
  }
  
  private handleEnterKey(): void
  {
    if (!this.activeField)
      return;
    
    if (this.activeField === 'newUsername')
      this.handleButtonClick('updateUsername');
    else if (this.activeField === 'newEmail')
      this.handleButtonClick('updateEmail');
  }
  
  private handleButtonClick(buttonName: string): void
  {
    if (this.loading)
      return;
    
    if (buttonName === 'updateUsername')
      this.updateUsername();
    else if (buttonName === 'updateEmail')
      this.updateEmail();
  }
  
  private async updateUsername(): Promise<void>
  {
    const newUsername = this.fields.newUsername.trim();
    
    if (!newUsername)
    {
      this.showError('Username cannot be empty');
      return;
    }
    
    if (newUsername === this.currentUsername)
    {
      this.showError('New username is the same as current');
      return;
    }
    
    if (newUsername.length < 3) 
    {
      this.showError('Username must be at least 3 characters');
      return;
    }
    
    if (newUsername.length > 20)
    {
      this.showError('Username must be less than 20 characters');
      return;
    }
    
    if (!/^[a-zA-Z0-9_-]+$/.test(newUsername))
    {
      this.showError('Username can only contain letters, numbers, - and _');
      return;
    }
    
    this.loading = true;
    this.clearMessages();
    
    try
    {
      const updatedUser = await ProfileAPI.updateProfile(this.userId, { username: newUsername });
      this.currentUsername = updatedUser.username;
      this.fields.newUsername = '';
      this.showSuccess('Username updated successfully!');
    }
    catch (error: any)
    {
      this.showError(error.message || 'Failed to update username');
    }
    finally
    {
      this.loading = false;
    }
  }
  
  private async updateEmail(): Promise<void>
  {
    const newEmail = this.fields.newEmail.trim();
    
    if (!newEmail)
    {
      this.showError('Email cannot be empty');
      return;
    }
    
    if (newEmail === this.currentEmail)
    {
      this.showError('New email is the same as current');
      return;
    }
    
    if (!this.isValidEmail(newEmail))
    {
      this.showError('Invalid email format');
      return;
    }
    
    this.loading = true;
    this.clearMessages();
    
    try
    {
      const updatedUser = await ProfileAPI.updateProfile(this.userId, { email: newEmail });
      this.currentEmail = updatedUser.email;
      this.fields.newEmail = '';
      this.showSuccess('Email updated successfully!');
    }
    catch (error: any)
    {
      this.showError(error.message || 'Failed to update email');
    }
    finally
    {
      this.loading = false;
    }
  }
  
  private isValidEmail(email: string): boolean
  {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  
  private showSuccess(message: string): void
  {
    this.successMessage = message;
    this.errorMessage = '';
    
    if (this.messageTimer)
      clearTimeout(this.messageTimer);
    this.messageTimer = window.setTimeout(() => {
      this.successMessage = '';
    }, 3000);
  }
  
  private showError(message: string): void
  {
    this.errorMessage = message;
    this.successMessage = '';
    
    if (this.messageTimer)
      clearTimeout(this.messageTimer);
    this.messageTimer = window.setTimeout(() => {
      this.errorMessage = '';
    }, 4000);
  }
  
  private clearMessages(): void
  {
    this.successMessage = '';
    this.errorMessage = '';
    if (this.messageTimer)
    {
      clearTimeout(this.messageTimer);
      this.messageTimer = null;
    }
  }
  
  getCursor(): string
  {
    return this.hoveredButton ? 'pointer' : 'default';
  }
  
  draw(ctx: CanvasRenderingContext2D, centerX: number, startY: number): void
  {
    const baseY = 300;
    

    this.drawUsernameColumn(ctx, centerX - 200, baseY);
    this.drawEmailColumn(ctx, centerX + 200, baseY);
    
    if (this.successMessage)
    {
      ctx.fillStyle = '#00ff00';
      ctx.font = '16px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(this.successMessage, centerX, baseY + 250);
    }
    
    if (this.errorMessage)
      UIHelpers.drawError(ctx, this.errorMessage, centerX, baseY + 250);
    
    if (this.loading)
      UIHelpers.drawLoading(ctx, 'Updating...', centerX, baseY + 290);
  }
  
  private drawUsernameColumn(ctx: CanvasRenderingContext2D, x: number, y: number): void
  {
    ctx.fillStyle = '#00ffff';
    ctx.font = '18px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('CHANGE USERNAME', x, y);
    
    ctx.fillStyle = '#888888';
    ctx.font = '12px monospace';
    ctx.fillText(`Current: ${this.currentUsername}`, x, y + 25);
    
    ctx.fillStyle = '#888888';
    ctx.font = '13px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('New Username', x - 175, y + 60);
    
    const fieldY = y + 75;
    const fieldWidth = 350;
    const isActive = this.activeField === 'newUsername';
    
    ctx.strokeStyle = isActive ? '#00ffff' : '#444444';
    ctx.lineWidth = 2;
    ctx.strokeRect(x - 175, fieldY, fieldWidth, 40);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '15px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(this.fields.newUsername || '', x - 165, fieldY + 25);
    
    if (isActive && Math.floor(Date.now() / 500) % 2 === 0)
    {
      const textWidth = ctx.measureText(this.fields.newUsername).width;
      ctx.fillRect(x - 165 + textWidth, fieldY + 10, 2, 20);
    }
    
    const btn = this.buttons.get('updateUsername')!;
    UIHelpers.drawButton(ctx, 'UPDATE', btn.x, btn.y, btn.width, btn.height, this.fields.newUsername.trim() ? '#00ff00' : '#666666', this.hoveredButton === 'updateUsername');
  }
  
  private drawEmailColumn(ctx: CanvasRenderingContext2D, x: number, y: number): void
  {
    ctx.fillStyle = '#00ffff';
    ctx.font = '18px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('CHANGE EMAIL', x, y);
    
    ctx.fillStyle = '#888888';
    ctx.font = '12px monospace';
    ctx.fillText(`Current: ${this.currentEmail}`, x, y + 25);
    
    const fieldWidth = 350;
    
    ctx.fillStyle = '#888888';
    ctx.font = '13px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('New Email', x - 175, y + 60);
    
    const emailFieldY = y + 75;
    const isEmailActive = this.activeField === 'newEmail';
    
    ctx.strokeStyle = isEmailActive ? '#00ffff' : '#444444';
    ctx.lineWidth = 2;
    ctx.strokeRect(x - 175, emailFieldY, fieldWidth, 40);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '15px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(this.fields.newEmail || '', x - 165, emailFieldY + 25);
    
    if (isEmailActive && Math.floor(Date.now() / 500) % 2 === 0)
    {
      const textWidth = ctx.measureText(this.fields.newEmail).width;
      ctx.fillRect(x - 165 + textWidth, emailFieldY + 10, 2, 20);
    }
    
    const btn = this.buttons.get('updateEmail')!;
    const canUpdate = this.fields.newEmail.trim();
    UIHelpers.drawButton(ctx, 'UPDATE', btn.x, btn.y, btn.width, btn.height, canUpdate ? '#00ff00' : '#666666', this.hoveredButton === 'updateEmail');
  }
  
  private isInFieldBounds(mouseY: number, fieldY: number, height: number): boolean
  {
    return mouseY >= fieldY && mouseY <= fieldY + height;
  }
  
  private getClickedColumn(mouseX: number, centerX: number): 'username' | 'email' | null
  {
    if (mouseX >= centerX - 375 && mouseX <= centerX - 25)
      return 'username';
    if (mouseX >= centerX + 25 && mouseX <= centerX + 375)
      return 'email';
    return null;
  }
  
  cleanup(): void
  {
    if (this.messageTimer)
    {
      clearTimeout(this.messageTimer);
      this.messageTimer = null;
    }
  }
}
