import { UIHelpers } from "../utils/UIHelpers";
import { ProfileUtils } from "../utils/ProfileUtils";

export abstract class BaseListComponent<T>
{
  protected scrollOffset: number = 0;
  protected maxVisibleItems: number = 4;
  protected loading: boolean = false;
  
  constructor(protected items: T[], loading: boolean)
  {
    this.loading = loading;
  }
  
  protected abstract getItemId(item: T): number;
  
  protected abstract drawItem( ctx: CanvasRenderingContext2D, item: T, centerX: number, y: number, isHovered: boolean): void;
  
  protected abstract getEmptyMessage(): string[];
  
  
  updateItems(items: T[], loading: boolean): void
  {
    this.items = items;
    this.loading = loading;
  }
  
  scroll(delta: number): void
  {
    this.scrollOffset += delta;
    this.scrollOffset = Math.max(0, Math.min(this.scrollOffset, Math.max(0, this.items.length - this.maxVisibleItems)));
  }
  
  getHoveredItemId(mouseX: number, mouseY: number, centerX: number, listStartY: number): number | null
  {
    const itemHeight = 80;
    const visibleItems = this.getVisibleItems();
    
    for (let index = 0; index < visibleItems.length; index++)
    {
      const y = listStartY + index * itemHeight;
      if (ProfileUtils.isUserCardButtonHovered(mouseX, mouseY, centerX, y))
        return this.getItemId(visibleItems[index]);
    }
    
    return null;
  }
  
  
  protected getVisibleItems(): T[]
  {
    return this.items.slice(this.scrollOffset, this.scrollOffset + this.maxVisibleItems);
  }
  
  draw(ctx: CanvasRenderingContext2D, centerX: number, listStartY: number, hoveredItemId: number | null): void
  {
    if (this.loading)
    {
      UIHelpers.drawLoading(ctx, 'Loading', centerX, listStartY + 100);
      return;
    }
    
    if (this.items.length === 0)
    {
      this.drawEmptyState(ctx, centerX, listStartY);
      return;
    }
    
    this.drawVisibleItems(ctx, centerX, listStartY, hoveredItemId);
    
    if (this.items.length > this.maxVisibleItems)
      ProfileUtils.drawScrollIndicator(ctx, centerX, listStartY + this.maxVisibleItems * 80 + 30, this.scrollOffset, this.maxVisibleItems, this.items.length);
  }
  
  protected drawEmptyState(ctx: CanvasRenderingContext2D, centerX: number, listStartY: number): void
  {
    const messages = this.getEmptyMessage();
    
    ctx.fillStyle = '#888888';
    ctx.font = '20px monospace';
    ctx.textAlign = 'center';
    
    messages.forEach((msg, i) => {
      ctx.fillText(msg, centerX, listStartY + 100 + (i * 30));
    });
  }
  
  protected drawVisibleItems(ctx: CanvasRenderingContext2D, centerX: number, listStartY: number, hoveredItemId: number | null): void
  {
    const itemHeight = 80;
    const visibleItems = this.getVisibleItems();
    
    visibleItems.forEach((item, index) => {
      const y = listStartY + index * itemHeight;
      const isHovered = hoveredItemId === this.getItemId(item);
      this.drawItem(ctx, item, centerX, y, isHovered);
    });
  }
}