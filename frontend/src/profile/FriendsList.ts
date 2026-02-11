import { Friend } from "./ProfileAPI";
import { FriendCard } from "./FriendCard";
import { BaseListComponent } from "../utils/BaseListComponent";
import { ProfileUtils } from "../utils/ProfileUtils";

export class FriendsList extends BaseListComponent<Friend>
{
  
  constructor(friends: Friend[], loading: boolean)
  {
    super(friends, loading);
  }
  
  updateFriends(friends: Friend[], loading: boolean): void
  {
    this.updateItems(friends, loading);
  }
  
  getHoveredFriendId(mouseX: number, mouseY: number, centerX: number, listStartY: number): { id: number | null; button: 'message' | 'action' | null }
  {
    const itemHeight = 80;
    const visibleItems = this.getVisibleItems();

    for (let index = 0; index < visibleItems.length; index++)
    {
      const y = listStartY + index * itemHeight;
      const item = visibleItems[index];
      if (item) {
        if (ProfileUtils.isUserCardMessageButtonHovered(mouseX, mouseY, centerX, y))
          return { id: this.getItemId(item), button: 'message' };
        if (ProfileUtils.isUserCardActionButtonHovered(mouseX, mouseY, centerX, y))
          return { id: this.getItemId(item), button: 'action' };
      }
    }

    return { id: null, button: null };
  }
  
  protected getItemId(friend: Friend): number
  {
    return friend.id;
  }
  
  protected drawItem(ctx: CanvasRenderingContext2D, friend: Friend, centerX: number, y: number, isHovered: boolean): void
  {
    FriendCard.draw(ctx, friend, centerX, y, 'remove', isHovered, friend.isOnline);
  }
  
  protected getEmptyMessage(): string[]
  {
    return ['No friends yet', 'Go to ADD FRIEND tab to add some!'];
  }
}