import { User, Friend } from "./ProfileAPI";
import { FriendCard } from "./FriendCard";
import { BaseListComponent } from "../utils/BaseListComponent";
import { UIHelpers } from "../utils/UIHelpers";

export class AddFriendList extends BaseListComponent<User>
{
  searchQuery: string = '';
  searchActive: boolean = false;
  
  private friends: Friend[] = [];
  private currentUserId: number;
  
  constructor(allUsers: User[], friends: Friend[], currentUserId: number, loading: boolean)
  {
    super(allUsers, loading);
    this.friends = friends;
    this.currentUserId = currentUserId;
  }
  
  updateUsers(users: User[], loading: boolean): void
  {
    this.updateItems(users, loading);
  }
  
  updateFriends(friends: Friend[]): void
  {
    this.friends = friends;
  }
  
  getHoveredUserId(mouseX: number, mouseY: number, centerX: number, listStartY: number): number | null
  {
    return this.getHoveredItemId(mouseX, mouseY, centerX, listStartY + 100);
  }
  
  private getFilteredUsers(): User[]
  {
    return this.items.filter(u => {

      if (u.id === this.currentUserId)
        return false;
      
      if (this.friends.some(f => f.id === u.id))
        return false;
      
      if (this.searchQuery)
        return u.username.toLowerCase().includes(this.searchQuery.toLowerCase());
      
      return true;
    });
  }
  
  protected getVisibleItems(): User[]
  {
    const filtered = this.getFilteredUsers();
    return filtered.slice(this.scrollOffset, this.scrollOffset + this.maxVisibleItems);
  }
  
  scroll(delta: number): void
  {
    this.scrollOffset += delta;
    const filtered = this.getFilteredUsers();
    this.scrollOffset = Math.max(0, Math.min(this.scrollOffset, Math.max(0, filtered.length - this.maxVisibleItems)));
  }
  
  handleKeyInput(key: string): void
  {
    if (key === 'Backspace' && this.searchQuery.length > 0)
      this.searchQuery = this.searchQuery.slice(0, -1);
    else if (key.length === 1 && /[a-zA-Z0-9]/.test(key))
    {
      this.searchQuery += key;
      this.searchActive = true;
    }
  }
  
  clearSearch(): void
  {
    this.searchQuery = '';
    this.searchActive = false;
  }
  
  isSearchBarClicked(mouseX: number, mouseY: number, centerX: number, listStartY: number): boolean
  {
    const searchY = listStartY + 20;
    return UIHelpers.isInBounds(mouseX, mouseY, {x: centerX - 200, y: searchY, width: 400, height: 35});
  }
  
  activateSearch(): void
  {
    this.searchActive = true;
  }
  
  protected getItemId(user: User): number
  {
    return user.id;
  }
  
  protected drawItem(ctx: CanvasRenderingContext2D, user: User, centerX: number, y: number, isHovered: boolean): void
  {
    FriendCard.draw(ctx, user, centerX, y, 'add', isHovered);
  }
  
  protected getEmptyMessage(): string[]
  {
    return this.searchQuery ? ['No users found'] : ['No users available'];
  }
  
  draw(ctx: CanvasRenderingContext2D, centerX: number, listStartY: number, hoveredUserId: number | null): void
  {
    this.drawSearchBar(ctx, centerX, listStartY);
    
    if (this.loading)
    {
      UIHelpers.drawLoading(ctx, 'Loading users', centerX, listStartY + 100);
      return;
    }
    
    const filteredUsers = this.getFilteredUsers();
    
    if (filteredUsers.length === 0)
    {
      this.drawEmptyState(ctx, centerX, listStartY);
      return;
    }
    
    this.drawVisibleItems(ctx, centerX, listStartY + 100, hoveredUserId);
    
    if (filteredUsers.length > this.maxVisibleItems)
    {
      const indicatorY = listStartY + this.maxVisibleItems * 80 + 130;
      ctx.fillStyle = '#666666';
      ctx.font = '14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`↑ ${this.scrollOffset + 1}-${Math.min(this.scrollOffset + this.maxVisibleItems, filteredUsers.length)} / ${filteredUsers.length} ↓`, centerX, indicatorY);
    }
  }
  
  private drawSearchBar(ctx: CanvasRenderingContext2D, centerX: number, listStartY: number): void
  {
    const searchY = listStartY + 20;
    
    ctx.strokeStyle = this.searchActive ? '#00ffff' : '#444444';
    ctx.lineWidth = 2;
    ctx.strokeRect(centerX - 200, searchY, 400, 35);
    
    ctx.fillStyle = '#888888';
    ctx.font = '14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('Search:', centerX - 190, searchY - 8);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px monospace';
    ctx.fillText(this.searchQuery || '', centerX - 190, searchY + 22);
    
    if (this.searchActive && Math.floor(Date.now() / 500) % 2 === 0)
    {
      const textWidth = ctx.measureText(this.searchQuery).width;
      ctx.fillRect(centerX - 190 + textWidth, searchY + 8, 2, 20);
    }
    
    if (!this.searchQuery && !this.searchActive)
    {
      ctx.fillStyle = '#666666';
      ctx.font = '14px monospace';
      ctx.fillText('Click to search...', centerX - 190, searchY + 22);
    }
  }
}