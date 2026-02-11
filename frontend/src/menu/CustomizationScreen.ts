import { PongCustomization, DEFAULT_PONG_CUSTOMIZATION } from '../games/config/customization';
import { UIHelpers } from '../utils/UIHelpers';

export class CustomizationScreen
{
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  
  private settings: PongCustomization;
  
  private buttons = new Map<string, { x: number; y: number; width: number; height: number }>();
  private hoveredButton: string | null = null;
  
  private mouseMoveHandler: (e: MouseEvent) => void;
  private clickHandler: (e: MouseEvent) => void;
  private keyDownHandler: (e: KeyboardEvent) => void;
  
  private onBack: (settings: PongCustomization) => void;
  
  constructor(canvas: HTMLCanvasElement, currentSettings: PongCustomization | null, onBack: (settings: PongCustomization) => void)
  {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.onBack = onBack;
    
    this.settings = currentSettings ? { ...currentSettings } : { ...DEFAULT_PONG_CUSTOMIZATION };
    
    this.mouseMoveHandler = (e: MouseEvent) => this.handleMouseMove(e);
    this.clickHandler = (e: MouseEvent) => this.handleClick(e);
    this.keyDownHandler = (e: KeyboardEvent) => this.handleKeyDown(e);
    
    this.calculatePositions();
    this.setupEventListeners();
  }
  
  private calculatePositions(): void
  {
    const centerX = this.canvas.width / 2;
    const startY = 250;
    const lineHeight = 80;
    
    this.buttons.set('togglePowerUps', {x: centerX - 100, y: startY, width: 120, height: 40});
    
    this.buttons.set('ballSpeedSlow', {x: centerX - 100, y: startY + lineHeight, width: 90, height: 40});
    this.buttons.set('ballSpeedNormal', {x: centerX, y: startY + lineHeight, width: 100, height: 40});
    this.buttons.set('ballSpeedFast', {x: centerX + 110, y: startY + lineHeight, width: 90, height: 40});
    
    this.buttons.set('winScore3', {x: centerX - 100, y: startY + lineHeight * 2, width: 60, height: 40});
    this.buttons.set('winScore5', {x: centerX - 30, y: startY + lineHeight * 2, width: 60, height: 40});
    this.buttons.set('winScore7', {x: centerX + 40, y: startY + lineHeight * 2, width: 60, height: 40});
    this.buttons.set('winScore10', {x: centerX + 110, y: startY + lineHeight * 2, width: 70, height: 40});
    
    this.buttons.set('toggleObstacles', {x: centerX - 100, y: startY + lineHeight * 3, width: 120, height: 40});
    
    this.buttons.set('reset', {x: centerX - 220, y: this.canvas.height - 100, width: 180, height: 50});
    
    this.buttons.set('back', {x: centerX + 40, y: this.canvas.height - 100, width: 180, height: 50});
  }
  
  private setupEventListeners(): void
  {
    this.canvas.addEventListener('mousemove', this.mouseMoveHandler);
    this.canvas.addEventListener('click', this.clickHandler);
    window.addEventListener('keydown', this.keyDownHandler);
  }
  
  private handleKeyDown(e: KeyboardEvent): void
  {
    if (e.key === 'Escape')
    {
      this.cleanup();
      this.onBack(this.settings);
    }
  }
  
  private handleMouseMove(e: MouseEvent): void
  {
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
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
  
  private handleClick(e: MouseEvent): void
  {
    if (!this.hoveredButton)
      return;
    
    if (this.hoveredButton === 'togglePowerUps')
      this.settings.powerUpsEnabled = !this.settings.powerUpsEnabled;
    else if (this.hoveredButton === 'ballSpeedSlow')
      this.settings.ballSpeed = 'slow';
    else if (this.hoveredButton === 'ballSpeedNormal') 
      this.settings.ballSpeed = 'normal';
    else if (this.hoveredButton === 'ballSpeedFast')
      this.settings.ballSpeed = 'fast';
    else if (this.hoveredButton === 'winScore3')
      this.settings.winScore = 3;
    else if (this.hoveredButton === 'winScore5')
      this.settings.winScore = 5;
    else if (this.hoveredButton === 'winScore7')
      this.settings.winScore = 7;
    else if (this.hoveredButton === 'winScore10')
      this.settings.winScore = 10;
    else if (this.hoveredButton === 'toggleObstacles') 
      this.settings.obstacles = !this.settings.obstacles;
    else if (this.hoveredButton === 'reset') 
      this.settings = { ...DEFAULT_PONG_CUSTOMIZATION };
    else if (this.hoveredButton === 'back')
    {
      this.cleanup();
      this.onBack(this.settings);
    }
  }
  
  draw(): void
  {
    const ctx = this.ctx;
    const centerX = this.canvas.width / 2;
    
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    UIHelpers.drawTitle(ctx, 'PONG CUSTOMIZATION', centerX, 150, '#00ffff', 36);
    
    const startY = 250;
    const lineHeight = 80;
    
    this.drawOption(ctx, 'POWER-UPS:', startY);
    this.drawToggleButton(ctx, 'togglePowerUps', this.settings.powerUpsEnabled);
    
    this.drawOption(ctx, 'BALL SPEED:', startY + lineHeight);
    this.drawMultiButton(ctx, ['ballSpeedSlow', 'ballSpeedNormal', 'ballSpeedFast'], 
      ['SLOW', 'NORMAL', 'FAST'], 
      this.settings.ballSpeed === 'slow' ? 0 : this.settings.ballSpeed === 'normal' ? 1 : 2);
    
    this.drawOption(ctx, 'WIN SCORE:', startY + lineHeight * 2);
    this.drawMultiButton(ctx, ['winScore3', 'winScore5', 'winScore7', 'winScore10'], 
      ['3', '5', '7', '10'], 
      this.settings.winScore === 3 ? 0 : this.settings.winScore === 5 ? 1 : this.settings.winScore === 7 ? 2 : 3);
    
    this.drawOption(ctx, 'OBSTACLES:', startY + lineHeight * 3);
    this.drawToggleButton(ctx, 'toggleObstacles', this.settings.obstacles);
    
    const resetBtn = this.buttons.get('reset')!;
    UIHelpers.drawButton(ctx, 'RESET', resetBtn.x, resetBtn.y, resetBtn.width, resetBtn.height,
      this.hoveredButton === 'reset' ? '#ffaa00' : '#666666', this.hoveredButton === 'reset');
    
    const backBtn = this.buttons.get('back')!;
    UIHelpers.drawButton(ctx, '✓ SAVE & BACK', backBtn.x, backBtn.y, backBtn.width, backBtn.height,
      this.hoveredButton === 'back' ? '#00ff00' : '#00ffff', this.hoveredButton === 'back');
    
    UIHelpers.drawHint(ctx, 'ESC to go back | Settings auto-saved', centerX, this.canvas.height - 40);
  }
  
  private drawOption(ctx: CanvasRenderingContext2D, label: string, y: number): void
  {
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(label, this.canvas.width / 2 - 250, y + 25);
  }
  
  private drawToggleButton(ctx: CanvasRenderingContext2D, buttonName: string, isOn: boolean): void
  {
    const btn = this.buttons.get(buttonName)!;
    const color = isOn ? '#00ff00' : '#ff4444';
    const text = isOn ? 'ON' : 'OFF';
    
    UIHelpers.drawButton(ctx, text, btn.x, btn.y, btn.width, btn.height,
      this.hoveredButton === buttonName ? color : '#666666', this.hoveredButton === buttonName);
  }
  
  private drawMultiButton(ctx: CanvasRenderingContext2D, buttonNames: string[], labels: string[], selectedIndex: number): void
  {
    buttonNames.forEach((name, i) => {
      const btn = this.buttons.get(name)!;
      const isSelected = i === selectedIndex;
      const color = isSelected ? '#00ffff' : '#666666';
      
      UIHelpers.drawButton(ctx, labels[i], btn.x, btn.y, btn.width, btn.height,
        this.hoveredButton === name ? color : (isSelected ? '#00ffff' : '#444444'), 
        this.hoveredButton === name);
    });
  }
  
  resize(): void
  {
    this.calculatePositions();
  }
  
  cleanup(): void
  {
    this.canvas.removeEventListener('mousemove', this.mouseMoveHandler);
    this.canvas.removeEventListener('click', this.clickHandler);
    window.removeEventListener('keydown', this.keyDownHandler);
  }
  
  getSettings(): PongCustomization
  {
    return this.settings;
  }
}