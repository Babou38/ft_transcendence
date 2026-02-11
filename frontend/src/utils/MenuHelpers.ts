import { UIHelpers } from './UIHelpers';

export interface MenuItem {
  label: string;
  action: string;
  x: number;
  y: number;
  width: number;
  height: number;
  disabled?: boolean;
}

export class MenuHelpers
{
  static createMenuItems(labels: Array<{ label: string; action: string; disabled?: boolean }>, canvasWidth: number, canvasHeight: number, itemWidth: number = 400, itemHeight: number = 50, startY?: number): MenuItem[]
  {
    const centerX = canvasWidth / 2;
    const baseY = startY ?? (canvasHeight / 2 - 20);
    
    return labels.map((item, i) => ({label: item.label, action: item.action, disabled: item.disabled || false, x: centerX - itemWidth / 2, y: baseY + i * itemHeight, width: itemWidth, height: 40}));
  }
  
  
  static getHoveredItem(mouseX: number, mouseY: number, items: MenuItem[], textOffsetY: number = 24, buttonPadding: number = 10): MenuItem | null
  {
    return items.find((item) => mouseX >= item.x && mouseX <= item.x + item.width && mouseY >= item.y - textOffsetY && mouseY <= item.y + item.height - buttonPadding) || null;
  }
  
  static drawMenuItem(ctx: CanvasRenderingContext2D, item: MenuItem, isHovered: boolean, defaultColor: string = '#ffffff', hoverColor: string = '#00ffff', disabledColor: string = '#444444', fontSize: number = 30): void
  {
    let color: string;
    if (item.disabled)
      color = disabledColor;
    else if (isHovered)
      color = hoverColor;
    else
      color = defaultColor;
    
    ctx.fillStyle = color;
    ctx.font = `${fontSize}px monospace`;
    ctx.textAlign = 'center';
    ctx.fillText(item.label, item.x + item.width / 2, item.y);
  }
  
  
  static drawMenu(ctx: CanvasRenderingContext2D, items: MenuItem[], hoveredItem: MenuItem | null, defaultColor: string = '#ffffff', hoverColor: string = '#00ffff', fontSize: number = 30): void
  {
    items.forEach(item => {
      const isHovered = item === hoveredItem;
      MenuHelpers.drawMenuItem(ctx, item, isHovered, defaultColor, hoverColor, '#444444', fontSize);
    });
  }
  
  
  static drawBreadcrumb(ctx: CanvasRenderingContext2D, breadcrumb: string, centerX: number, y: number, color: string = '#666666', fontSize: number = 18): void
  {
    ctx.font = `${fontSize}px monospace`;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.fillText(breadcrumb, centerX, y);
  }
  
  static drawUserInfo(ctx: CanvasRenderingContext2D, username: string, wins: number, losses: number, centerX: number, y: number): void
  {
    ctx.font = '20px monospace';
    ctx.fillStyle = '#00ffff';
    ctx.textAlign = 'center';
    ctx.fillText(`Welcome, ${username}!`, centerX, y);
    
    ctx.font = '16px monospace';
    ctx.fillStyle = '#888888';
    ctx.fillText(`Wins: ${wins} | Losses: ${losses}`, centerX, y + 25);
  }
  
  static drawMenuHint(ctx: CanvasRenderingContext2D, hint: string, centerX: number, y: number, color: string = '#888888', fontSize: number = 18): void
  {
    ctx.font = `${fontSize}px monospace`;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.fillText(hint, centerX, y);
  }
  
  
  static getActionByIndex(items: MenuItem[], index: number): string | null
  {
    if (index >= 0 && index < items.length)
    {
      const item = items[index];
      return item.disabled ? null : item.action;
    }
    return null;
  }
  
  static createBreadcrumb(parts: string[]): string
  {
    return parts.join(' > ');
  }
}