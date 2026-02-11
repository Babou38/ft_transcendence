import { PacmanCustomization, DEFAULT_PACMAN_CUSTOMIZATION } from '../games/config/pacmanCustomization';
import { UIHelpers } from '../utils/UIHelpers';

export class PacmanCustomizationScreen
{
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  
  private settings: PacmanCustomization;
  
  private buttons = new Map<string, { x: number; y: number; width: number; height: number }>();
  private hoveredButton: string | null = null;
  
  private mouseMoveHandler: (e: MouseEvent) => void;
  private clickHandler: (e: MouseEvent) => void;
  private keyDownHandler: (e: KeyboardEvent) => void;
  
  private onBack: (settings: PacmanCustomization) => void;
  
  constructor(canvas: HTMLCanvasElement, currentSettings: PacmanCustomization | null, onBack: (settings: PacmanCustomization) => void)
  {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.onBack = onBack;
    
    this.settings = currentSettings ? { ...currentSettings } : { ...DEFAULT_PACMAN_CUSTOMIZATION };
    
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
    
    this.buttons.set('togglePowerUps', {x: centerX - 60, y: startY, width: 120, height: 40});
    
    this.buttons.set('lives1', {x: centerX - 60, y: startY + lineHeight, width: 60, height: 40});
    this.buttons.set('lives3', {x: centerX + 10, y: startY + lineHeight, width: 60, height: 40});
    this.buttons.set('lives5', {x: centerX + 80, y: startY + lineHeight, width: 60, height: 40});
    
    this.buttons.set('ghostSpeedSlow', {x: centerX - 60, y: startY + lineHeight * 2, width: 100, height: 40});
    this.buttons.set('ghostSpeedNormal', {x: centerX + 60, y: startY + lineHeight * 2, width: 100, height: 40});
    this.buttons.set('ghostSpeedFast', {x: centerX + 170, y: startY + lineHeight * 2, width: 100, height: 40});
    
    this.buttons.set('reset', {x: centerX - 220, y: this.canvas.height - 110, width: 180, height: 50});
    this.buttons.set('back', {x: centerX + 40, y: this.canvas.height - 110, width: 180, height: 50});
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
    else if (this.hoveredButton === 'lives1')
      this.settings.startingLives = 1;
    else if (this.hoveredButton === 'lives3')
      this.settings.startingLives = 3;
    else if (this.hoveredButton === 'lives5')
      this.settings.startingLives = 5;
    else if (this.hoveredButton === 'ghostSpeedSlow')
      this.settings.ghostSpeed = 'slow';
    else if (this.hoveredButton === 'ghostSpeedNormal')
      this.settings.ghostSpeed = 'normal';
    else if (this.hoveredButton === 'ghostSpeedFast')
      this.settings.ghostSpeed = 'fast';
    else if (this.hoveredButton === 'reset')
      this.settings = { ...DEFAULT_PACMAN_CUSTOMIZATION };
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
    
    UIHelpers.drawTitle(ctx, 'PAC-MAN CUSTOMIZATION', centerX, 150, '#ffaa00', 36);
    
    const startY = 250;
    const lineHeight = 80;
    
    this.drawOption(ctx, 'POWER-UPS:', startY);
    this.drawToggleButton(ctx, 'togglePowerUps', this.settings.powerUpsEnabled);
    
    this.drawOption(ctx, 'STARTING LIVES:', startY + lineHeight);
    this.drawMultiButton(ctx, ['lives1', 'lives3', 'lives5'], 
      ['1', '3', '5'], 
      this.settings.startingLives === 1 ? 0 : this.settings.startingLives === 3 ? 1 : 2);
    
    this.drawOption(ctx, 'GHOST SPEED:', startY + lineHeight * 2);
    this.drawMultiButton(ctx, ['ghostSpeedSlow', 'ghostSpeedNormal', 'ghostSpeedFast'], 
      ['SLOW', 'NORMAL', 'FAST'], 
      this.settings.ghostSpeed === 'slow' ? 0 : this.settings.ghostSpeed === 'normal' ? 1 : 2);
    
    const resetBtn = this.buttons.get('reset')!;
    UIHelpers.drawButton(ctx, 'RESET', resetBtn.x, resetBtn.y, resetBtn.width, resetBtn.height,
      this.hoveredButton === 'reset' ? '#ffaa00' : '#666666', this.hoveredButton === 'reset');
    
    const backBtn = this.buttons.get('back')!;
    UIHelpers.drawButton(ctx, '✓ SAVE & BACK', backBtn.x, backBtn.y, backBtn.width, backBtn.height,
      this.hoveredButton === 'back' ? '#00ff00' : '#ffaa00', this.hoveredButton === 'back');
    
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
      const color = isSelected ? '#ffaa00' : '#666666';
      
      UIHelpers.drawButton(ctx, labels[i], btn.x, btn.y, btn.width, btn.height,
        this.hoveredButton === name ? color : (isSelected ? '#ffaa00' : '#444444'), 
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
  
  getSettings(): PacmanCustomization
  {
    return this.settings;
  }
}