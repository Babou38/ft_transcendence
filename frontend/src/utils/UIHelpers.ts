export class UIHelpers
{
  
  static drawField(ctx: CanvasRenderingContext2D, label: string, value: string, x: number, y: number, width: number, height: number, isActive: boolean): void
  {
    ctx.fillStyle = '#888888';
    ctx.textAlign = 'left';
    ctx.font = '16px monospace';
    ctx.fillText(label, x, y - 10);
    
    ctx.strokeStyle = isActive ? '#00ffff' : '#444444';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '18px monospace';
    ctx.fillText(value || '', x + 10, y + height / 2 + 7);
    
    if (isActive && Math.floor(Date.now() / 500) % 2 === 0)
    {
      const textWidth = ctx.measureText(value).width;
      ctx.fillRect(x + 10 + textWidth, y + 10, 2, 20);
    }
  }

  static drawButton(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, width: number, height: number, color: string, isHovered: boolean = false): void
  {
    if (isHovered && color !== '#666666')
    {
      ctx.fillStyle = `${color}22`;
      ctx.fillRect(x, y, width, height);
    }
    
    ctx.strokeStyle = color;
    ctx.lineWidth = isHovered ? 3 : 2;
    ctx.strokeRect(x, y, width, height);
    
    ctx.fillStyle = color;
    ctx.font = isHovered ? 'bold 18px monospace' : '18px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(text, x + width / 2, y + height / 2 + 6);
  }

  
  static isInBounds(x: number, y: number, bounds: { x: number; y: number; width: number; height: number }): boolean
  {
    return (x >= bounds.x && x <= bounds.x + bounds.width && y >= bounds.y && y <= bounds.y + bounds.height);
  }

  
  static drawTitle(ctx: CanvasRenderingContext2D, text: string, centerX: number, y: number, color: string = '#00ffff', fontSize: number = 42): void
  {
    ctx.fillStyle = color;
    ctx.font = `${fontSize}px monospace`;
    ctx.textAlign = 'center';
    ctx.fillText(text, centerX, y);
    
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX - 200, y + 20);
    ctx.lineTo(centerX + 200, y + 20);
    ctx.stroke();
  }

  
  static drawLoading(ctx: CanvasRenderingContext2D, text: string, centerX: number, y: number): void
  {
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px monospace';
    ctx.textAlign = 'center';
    
    const dots = '.'.repeat((Math.floor(Date.now() / 500) % 3) + 1);
    ctx.fillText(`${text}${dots}`, centerX, y);
  }

  static drawError(ctx: CanvasRenderingContext2D, error: string, centerX: number, y: number): void
  {
    ctx.fillStyle = '#ff0000';
    ctx.font = '16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(error, centerX, y);
  }

  static drawHint(ctx: CanvasRenderingContext2D, hint: string, centerX: number, y: number): void
  {
    ctx.fillStyle = '#666666';
    ctx.font = '14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(hint, centerX, y);
  }

  static isValidEmail(email: string): boolean
  {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  static isValidInputChar(char: string): boolean
  {
    return /[a-zA-Z0-9@.\-_]/.test(char);
  }

  
  static centerElement(canvasWidth: number, elementWidth: number): number
  {
    return (canvasWidth - elementWidth) / 2;
  }

  static drawTab(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, width: number, height: number, isActive: boolean): void
  {
    ctx.strokeStyle = isActive ? '#00ffff' : '#444444';
    ctx.fillStyle = isActive ? '#00ffff' : '#666666';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);
    
    ctx.font = '14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(text, x + width / 2, y + 25);
  }

  static drawAvatar(ctx: CanvasRenderingContext2D, img: HTMLImageElement | null, x: number, y: number, radius: number, initials: string, borderColor: string = '#00ffff'): void
  {
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.stroke();
    
    if (img && img.complete && img.naturalWidth > 0)
    {
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      
      ctx.drawImage(img, x - radius, y - radius, radius * 2, radius * 2);
      ctx.restore();
      
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.stroke();
    }
    else
    {
      ctx.fillStyle = borderColor;
      ctx.font = `${radius / 2}px monospace`;
      ctx.textAlign = 'center';
      ctx.fillText(initials, x, y + radius / 4);
    }
  }

  static drawStatCard(ctx: CanvasRenderingContext2D, label: string, value: string, x: number, y: number, width: number, height: number, valueColor: string = '#00ffff'): void
  {
    ctx.fillStyle = '#111111';
    ctx.fillRect(x, y, width, height);
    
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);
    
    ctx.fillStyle = '#888888';
    ctx.font = '14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(label, x + width / 2, y + 30);
    
    ctx.fillStyle = valueColor;
    ctx.font = 'bold 24px monospace';
    ctx.fillText(value, x + width / 2, y + 60);
  }
}