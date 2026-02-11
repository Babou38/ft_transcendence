import { Friend, User } from "./ProfileAPI";
import { ProfileUtils } from "../utils/ProfileUtils";

export class FriendCard
{
  
  static draw(ctx: CanvasRenderingContext2D, user: Friend | User, centerX: number, y: number, action: 'add' | 'remove', isHovered: boolean, isOnline?: boolean): void
  {
    ProfileUtils.drawUserCard(ctx, user, centerX, y, action, isHovered, isOnline);
  }
  
  static isButtonHovered(mouseX: number, mouseY: number, centerX: number, y: number): boolean
  {
    return ProfileUtils.isUserCardButtonHovered(mouseX, mouseY, centerX, y);
  }
}