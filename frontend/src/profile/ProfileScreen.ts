import { AuthService } from "../auth/AuthService";
import { User, Friend, ProfileAPI, loadUserProfile } from "./ProfileAPI";
import { ProfileInfo } from "./ProfileInfo";
import { FriendsList } from "./FriendsList";
import { ChatScreen } from "../chat/ChatScreen";
import { AddFriendList } from "./AddFriendList";
import { Dashboard } from "./Dashboard";
import { DashboardAPI } from "./DashboardAPI";
import { UIHelpers } from "../utils/UIHelpers";
import { SettingsTab } from "./SettingsTab";

type Tab = 'info' | 'stats' | 'friends' | 'addFriend' | 'settings';

export class ProfileScreen
{
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  
  private user: User;
  private currentTab: Tab = 'info';
  private activeChat: ChatScreen | null = null;
  
  private profileInfo: ProfileInfo;
  private dashboard: Dashboard;
  private friendsList: FriendsList;
  private addFriendList: AddFriendList;
  private settingsTab: SettingsTab;
  
  private lastClickTime: number = 0;
  private clickCooldown: number = 1000;
  
  private buttons = new Map<string, { x: number; y: number; width: number; height: number }>();
  private hoveredButton: string | null = null;
  private hoveredItemId: number | null = null;
  private hoveredItemButton: 'message' | 'action' | null = null;

  private keyDownHandler: (e: KeyboardEvent) => void;
  private mouseMoveHandler: (e: MouseEvent) => void;
  private clickHandler: (e: MouseEvent) => void;
  private wheelHandler: (e: WheelEvent) => void;

  constructor(canvas: HTMLCanvasElement, private targetUserId?: number)
  {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    
    const currentUser = AuthService.getCurrentUser();
    if (!currentUser)
      throw new Error('No user logged in');
    this.user = currentUser;
    
    this.profileInfo = new ProfileInfo(this.user);
    this.dashboard = new Dashboard(null, false);
    this.friendsList = new FriendsList([], true);
    this.addFriendList = new AddFriendList([], [], this.user.id, false);
    this.settingsTab = new SettingsTab(this.user.id, this.user.username, this.user.email);
    
    this.calculatePositions();
    this.keyDownHandler = (e: KeyboardEvent) => this.handleKeyDown(e);
    this.mouseMoveHandler = (e: MouseEvent) => this.handleMouseMove(e);
    this.clickHandler = (e: MouseEvent) => this.handleClick(e);
    this.wheelHandler = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 1 : -1;
      
      if (this.currentTab === 'friends')
        this.friendsList.scroll(delta);
      else if (this.currentTab === 'addFriend')
        this.addFriendList.scroll(delta);
    };
    this.setupEventListeners();
    
    if (this.targetUserId) {
      this.loadUserData(this.targetUserId);
    } else {
      this.loadFriends();
    }
  }

  public async loadUserData(targetUserId?: number): Promise<void> {
    try {
      const userId = targetUserId || this.user.id;
      const user = await loadUserProfile(userId);
      
      const isOwnProfile = userId === AuthService.getCurrentUser()?.id;
      
      this.user = user;
      this.profileInfo.updateUser(this.user);
      this.settingsTab.updateUserInfo(this.user.username, this.user.email);
      console.log("Chargement des stats pour l'ID:", this.user.id);
      await this.loadDashboard(this.user.id);
      
      if (isOwnProfile) {
        await this.loadFriends();
      } else {
        this.currentTab = 'info';
      }

      this.draw();
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  }

  private async refreshUserData(): Promise<void>
  {
    try
    {
      const user = await AuthService.fetchCurrentUser();
      this.user = user;
      this.profileInfo = new ProfileInfo(this.user);
      this.addFriendList = new AddFriendList([], [], this.user.id, false);
      this.settingsTab.updateUserInfo(this.user.username, this.user.email);
    }
    catch (error)
    {
      console.error('Failed to refresh user data:', error);
    }
  }

  private calculatePositions(): void
  {
    const centerX = this.canvas.width / 2;
    
    this.buttons.set('back', {x: 50, y: this.canvas.height - 80, width: 150, height: 50});
    
    this.buttons.set('uploadAvatar', {x: centerX - 100, y: this.canvas.height - 150, width: 200, height: 50});
    
    const tabY = 160;
    const tabHeight = 40;
    
    this.buttons.set('tabInfo', {x: centerX - 350, y: tabY, width: 100, height: tabHeight});
    this.buttons.set('tabStats', {x: centerX - 240, y: tabY, width: 100, height: tabHeight});
    this.buttons.set('tabFriends', {x: centerX - 130, y: tabY, width: 140, height: tabHeight});
    this.buttons.set('tabAddFriend', {x: centerX + 20, y: tabY, width: 140, height: tabHeight});
    this.buttons.set('tabSettings', {x: centerX + 170, y: tabY, width: 140, height: tabHeight});
  }

  private setupEventListeners(): void
  {
    this.canvas.addEventListener('mousemove', this.mouseMoveHandler);
    this.canvas.addEventListener('click', this.clickHandler);
    this.canvas.addEventListener('wheel', this.wheelHandler);
    
    window.addEventListener('keydown', this.keyDownHandler);
  }

  private handleKeyDown(e: KeyboardEvent): void
  {
    if (this.activeChat)
      return;
    if (e.key === 'Escape')
    {
      if (this.addFriendList.searchActive)
        this.addFriendList.clearSearch();
      else
        window.dispatchEvent(new CustomEvent('exit-profile'));
    }
    else if (e.key === 'Tab')
    {
      e.preventDefault();
      this.switchTab();
    }
    else if (this.currentTab === 'addFriend')
      this.addFriendList.handleKeyInput(e.key);
    else if (this.currentTab === 'settings')
      this.settingsTab.handleKeyInput(e.key);
  }

  private switchTab(): void
  {
    const currentUser = AuthService.getCurrentUser();
    const isOwnProfile = this.user.id === currentUser?.id;
    
    const tabs: Tab[] = isOwnProfile ? ['info', 'stats', 'friends', 'addFriend', 'settings'] : ['info', 'stats'];
      
    const currentIndex = tabs.indexOf(this.currentTab);
    const nextIndex = (currentIndex + 1) % tabs.length;
    this.currentTab = tabs[nextIndex];
    
    if (this.currentTab === 'stats')
      this.loadDashboard();
    else if (this.currentTab === 'addFriend')
      this.loadAllUsers();
  }

  private async loadDashboard(userId?: number): Promise<void>
  {
    try
    {
      this.dashboard.updateStats(null, true);
      const targetId = userId || this.user.id;
      const stats = await DashboardAPI.loadDashboard(targetId);
      this.dashboard.updateStats(stats, false);
    }
    catch (error)
    {
      console.error('Failed to load dashboard:', error);
      this.dashboard.updateStats(null, false);
    }
  }

  private async loadFriends(): Promise<void>
{
  try
  {
    const [friends, onlineFriendIds] = await Promise.all([
      ProfileAPI.loadFriends(this.user.id),
      ProfileAPI.loadOnlineFriends(this.user.id)
    ]);
    
    const friendsWithStatus = friends.map(friend => ({
      ...friend,
      isOnline: onlineFriendIds.includes(friend.id)
    }));
    
    this.friendsList.updateFriends(friendsWithStatus, false);
    this.addFriendList.updateFriends(friendsWithStatus);
  }
  catch (error)
  {
    console.error('Failed to load friends:', error);
    this.friendsList.updateFriends([], false);
  }
}

  private async loadAllUsers(): Promise<void>
  {
    try
    {
      this.addFriendList.updateUsers([], true);
      const users = await ProfileAPI.loadAllUsers();
      this.addFriendList.updateUsers(users, false);
    }
    catch (error)
    {
      console.error('Failed to load users:', error);
      this.addFriendList.updateUsers([], false);
    }
  }

  private async addFriend(friendId: number): Promise<void>
  {
    try
    {
      await ProfileAPI.addFriend(this.user.id, friendId);
      console.log('Friend added');
      await this.loadFriends();
    }
    catch (error: any)
    {
    }
  }

  private async removeFriend(friendId: number): Promise<void>
  {
    try
    {
      await ProfileAPI.removeFriend(this.user.id, friendId);
      console.log('Friend removed');
      await this.loadFriends();
    }
    catch (error: any)
    {
    }
  }

  private handleMouseMove(e: MouseEvent): void
  {
    if (this.activeChat)
    {
      return;
    }
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const centerX = this.canvas.width / 2;
    
    this.hoveredButton = null;
    this.hoveredItemId = null;
    
    for (const [name, bounds] of this.buttons)
      {
        if (UIHelpers.isInBounds(mouseX, mouseY, bounds)) 
        {
          if (name === 'uploadAvatar' && this.currentTab !== 'info')
            continue;
          
          this.hoveredButton = name;
          break;
        }
    }
    
    const listStartY = 230;
    if (this.currentTab === 'friends')
    {
      const res = this.friendsList.getHoveredFriendId(mouseX, mouseY, centerX, listStartY);
      this.hoveredItemId = res.id;
      this.hoveredItemButton = res.button;
    }
    else if (this.currentTab === 'addFriend')
      this.hoveredItemId = this.addFriendList.getHoveredUserId(mouseX, mouseY, centerX, listStartY);
    else if (this.currentTab === 'settings')
      this.settingsTab.handleMouseMove(mouseX, mouseY);
    
    
    const settingsCursor = this.currentTab === 'settings' ? this.settingsTab.getCursor() : 'default';
    this.canvas.style.cursor = (this.hoveredButton || this.hoveredItemId || settingsCursor === 'pointer') ? 'pointer' : 'default';
  }

  private async handleClick(e: MouseEvent): Promise<void>
  {
    if (this.activeChat)
    {
      return;
    }
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const centerX = this.canvas.width / 2;
    const listStartY = 230;
    
    if (this.hoveredButton)
    {
      this.handleButtonClick(this.hoveredButton);
      return;
    }
    
    if (this.currentTab === 'addFriend' && this.addFriendList.isSearchBarClicked(mouseX, mouseY, centerX, listStartY))
    {
      this.addFriendList.activateSearch();
      return;
    }
    
    if (this.currentTab === 'settings')
    {
      const settingsHandled = this.settingsTab.handleClick(mouseX, mouseY, centerX);
      if (settingsHandled)
      {
        await this.refreshUserData();
        return;
      }
    }
    
    const res = this.currentTab === 'friends'
      ? this.friendsList.getHoveredFriendId(mouseX, mouseY, centerX, listStartY)
      : { id: this.addFriendList.getHoveredUserId(mouseX, mouseY, centerX, listStartY), button: null };

    if (res.id)
    {
      const now = Date.now();
      if (now - this.lastClickTime < this.clickCooldown)
        return;
      
      this.lastClickTime = now;
      
      if (this.currentTab === 'friends')
      {
        if (res.button === 'message')
        {
          this.activeChat = new ChatScreen(this.canvas, () => {
            this.activeChat = null;
            this.draw();
          });
          await this.activeChat.loadMessages(res.id);
          this.draw();
          return;
        }
        else
        {
          this.removeFriend(res.id);
        }
      }
      else if (this.currentTab === 'addFriend')
      {
        this.addFriend(res.id);
      }
    }
  }

  private handleButtonClick(buttonName: string): void
  {
    if (buttonName === 'back')
      window.dispatchEvent(new CustomEvent('exit-profile'));
    else if (buttonName === 'uploadAvatar')
      this.handleUploadAvatar();
    else if (buttonName.startsWith('tab'))
      this.handleTabClick(buttonName);
  }

  private handleTabClick(buttonName: string): void
  {
    const currentUser = AuthService.getCurrentUser();
    const isOwnProfile = this.user.id === currentUser?.id;
    
    if (buttonName === 'tabInfo')
      this.currentTab = 'info';
    else if (buttonName === 'tabStats')
    {
      this.currentTab = 'stats';
      this.loadDashboard();
    }
    else if (buttonName === 'tabFriends' && isOwnProfile)
      this.currentTab = 'friends';
    else if (buttonName === 'tabAddFriend' && isOwnProfile)
    {
      this.currentTab = 'addFriend';
      this.loadAllUsers();
    }
    else if (buttonName === 'tabSettings' && isOwnProfile)
      this.currentTab = 'settings';
  }

  private async handleUploadAvatar(): Promise<void>
  {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png,image/jpg';
    
    input.onchange = async (e: Event) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      
      if (!file)
        return;
      
      try
      {
        const avatarFilename = await ProfileAPI.uploadAvatar(this.user.id, file);
        this.user.avatar = avatarFilename;
        
        this.profileInfo.updateUser(this.user);
        
        await AuthService.fetchCurrentUser();
        
        console.log('Avatar uploaded successfully');
      }
      catch (error: any)
      {
        console.warn('Upload error:', error);
        alert(error.message);
      }
    };
    
    input.click();
  }

  draw(): void
  {
    if (this.activeChat)
    {
      // @ts-ignore
      this.activeChat.draw();
      return;
    }
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    const centerX = this.canvas.width / 2;
    const startY = 100;
    
    const currentUser = AuthService.getCurrentUser();
    const isOwnProfile = this.user.id === currentUser?.id;
    const title = isOwnProfile ? 'USER PROFILE' : `${this.user.username.toUpperCase()}'S PROFILE`;
    UIHelpers.drawTitle(this.ctx, title, centerX, startY);
    
    this.drawTabs(centerX);
    
    const listStartY = 230;
    if (this.currentTab === 'info')
      this.profileInfo.draw(this.ctx, centerX, startY);
    else if (this.currentTab === 'stats')
      this.dashboard.draw(this.ctx, centerX, startY);
    else if (this.currentTab === 'friends')
      this.friendsList.draw(this.ctx, centerX, listStartY, this.hoveredItemId);
    else if (this.currentTab === 'addFriend')
      this.addFriendList.draw(this.ctx, centerX, listStartY, this.hoveredItemId);
    else if (this.currentTab === 'settings')
      this.settingsTab.draw(this.ctx, centerX, listStartY);
    
    this.drawBottomButtons();
    
    this.drawHint(centerX);
  }

  private drawTabs(centerX: number): void
  {
    const friendsCount = (this.friendsList as any).items?.length || 0;
    const currentUser = AuthService.getCurrentUser();
    const isOwnProfile = this.user.id === currentUser?.id;
    
    const tabs = [
      { name: 'tabInfo', label: 'INFO', tab: 'info' as Tab },
      { name: 'tabStats', label: 'STATS', tab: 'stats' as Tab },
      ...(isOwnProfile ? [
        { name: 'tabFriends', label: `FRIENDS (${friendsCount})`, tab: 'friends' as Tab },
        { name: 'tabAddFriend', label: 'ADD FRIEND', tab: 'addFriend' as Tab },
        { name: 'tabSettings', label: 'SETTINGS', tab: 'settings' as Tab }
      ] : [])
    ];
    
    tabs.forEach(({ name, label, tab }) => {
      const button = this.buttons.get(name)!;
      UIHelpers.drawTab(this.ctx, label, button.x, button.y, button.width, button.height, this.currentTab === tab);
    });
  }

  private drawBottomButtons(): void
  {
    const currentUser = AuthService.getCurrentUser();
    const isOwnProfile = this.user.id === currentUser?.id;
    
    const backBtn = this.buttons.get('back')!;
    UIHelpers.drawButton(this.ctx, '← BACK', backBtn.x, backBtn.y, backBtn.width, backBtn.height, this.hoveredButton === 'back' ? '#00ffff' : '#888888', this.hoveredButton === 'back');
    
    if (this.currentTab === 'info' && isOwnProfile)
    {
      const uploadBtn = this.buttons.get('uploadAvatar')!;
      UIHelpers.drawButton(this.ctx, 'UPLOAD AVATAR', uploadBtn.x, uploadBtn.y, uploadBtn.width, uploadBtn.height, this.hoveredButton === 'uploadAvatar' ? '#00ffff' : '#666666', this.hoveredButton === 'uploadAvatar');
    }
  }

  private drawHint(centerX: number): void
  {
    const hint = this.currentTab === 'addFriend' && this.addFriendList.searchActive ? 'Type to search | ESC to clear' : 'ESC to go back | TAB to switch tabs';
    UIHelpers.drawHint(this.ctx, hint, centerX, this.canvas.height - 30);
  }

  resize(): void
  {
    this.calculatePositions();
  }

  cleanup(): void
  {
    this.canvas.removeEventListener('mousemove', this.mouseMoveHandler);
    this.canvas.removeEventListener('click', this.clickHandler);
    this.canvas.removeEventListener('wheel', this.wheelHandler);
    window.removeEventListener('keydown', this.keyDownHandler);
    this.settingsTab.cleanup();
  }
}