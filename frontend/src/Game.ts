import { PongGame } from "./games/pong/PongGame";
import { PacmanGame } from "./games/pacman/PacmanGame";
import { AuthScreen } from "./auth/AuthScreen";
import { AuthGuard } from "./auth/AuthGuard";
import { ProfileScreen } from "./profile/ProfileScreen";
import { AuthService } from "./auth/AuthService";
import { GAME_CONFIG, GameMode } from "./games/config/config";
import { Player2AuthScreen } from "./auth/Player2AuthScreen";
import { MenuScreen, MenuState } from "./menu/MenuScreen";
import { CustomizationScreen } from "./menu/CustomizationScreen";
import { PongCustomization, DEFAULT_PONG_CUSTOMIZATION } from "./games/config/customization";
import { PacmanCustomizationScreen } from "./menu/PacmanCustomizationScreen";
import { PacmanCustomization, DEFAULT_PACMAN_CUSTOMIZATION } from "./games/config/pacmanCustomization";
import { TournamentScreen } from "./tournament/TournamentScreen";
import { TournamentBracket } from "./tournament/TournamentBracket";
import { Tournament, TournamentMatch } from "./tournament/Tournament";
import { TournamentMatchEndScreen } from "./tournament/TournamentMatchEndScreen";
import { TournamentAddPlayerScreen, TournamentPlayer } from "./tournament/TournamentAddPlayerScreen";

type AppState = "auth" | "menu" | "game" | "profile" | "tournament" | "tournamentMatchEnd" | "tournamentAddPlayer";

interface NavigationState
{
  screen: string;
  menuState?: MenuState;
  gameMode?: GameMode;
  data?: any;
}

interface User
{
  id: number;
  username: string;
  email: string;
  avatar: string;
  wins: number;
  losses: number;
}

export class Game
{
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  
  private keys: Record<string, boolean> = {};
  
  private appState: AppState = "auth";
  private gameMode: GameMode = "none";
  
  private authScreen: AuthScreen | null = null;
  private menuScreen: MenuScreen | null = null;
  private profileScreen: ProfileScreen | null = null;
  private customizationScreen: CustomizationScreen | null = null;
  private pacmanCustomizationScreen: PacmanCustomizationScreen | null = null;
  private externalGame: PongGame | PacmanGame | null = null;
  private player2AuthScreen: Player2AuthScreen | null = null;
  
  private tournamentScreen: TournamentScreen | null = null;
  private tournamentAddPlayerScreen: TournamentAddPlayerScreen | null = null;
  private tournamentBracket: TournamentBracket | null = null;
  private tournament: Tournament | null = null;
  private currentTournamentMatch: TournamentMatch | null = null;
  private tournamentMatchEndScreen: TournamentMatchEndScreen | null = null;
  private isTournamentMode: boolean = false;
  private tournamentGameType: 'pong' | 'pacman' = 'pong';
  
  private currentUser: User | null = null;
  private player2Info: any = null;
  
  private isRestoringState: boolean = false;
  
  private pongSettings: PongCustomization = { ...DEFAULT_PONG_CUSTOMIZATION };
  private pacmanSettings: PacmanCustomization = { ...DEFAULT_PACMAN_CUSTOMIZATION };

constructor()
{
  this.canvas = this.createCanvas();
  this.ctx = this.canvas.getContext("2d")!;

  this.setupEventListeners();
  this.resize();
  
  this.initializeAuth();
  
  this.loop();
}

  private createCanvas(): HTMLCanvasElement
  {
    const canvas = document.createElement("canvas");
    
    document.body.style.margin = "0";
    document.body.style.backgroundColor = GAME_CONFIG.CANVAS.BACKGROUND_COLOR;
    canvas.style.display = "block";
    canvas.style.cursor = "default";
    
    document.body.appendChild(canvas);
    return canvas;
  }

  private setupEventListeners(): void
  {
    window.addEventListener("keydown", (e) => this.handleGlobalKeyDown(e));
    window.addEventListener("keyup", (e) => (this.keys[e.key] = false));
    window.addEventListener("resize", () => this.resize());
    
    window.addEventListener("exit-pacman", () => this.exitExternalGame());
    window.addEventListener("exit-pong", () => this.exitExternalGame());
    window.addEventListener("exit-profile", () => this.exitProfile());
    window.addEventListener("auth-success", (e: Event) => this.handleAuthSuccess(e as CustomEvent));
    
    window.addEventListener("force-logout", () => this.handleForceLogout());
    
    window.addEventListener("view-user-profile", (e: Event) => this.handleViewUserProfile(e as CustomEvent));

    window.addEventListener("popstate", (e: PopStateEvent) => this.handleBrowserNavigation(e));
  }

  private handleGlobalKeyDown(e: KeyboardEvent): void
  {
    this.keys[e.key] = true;
  }

  private navigate(state: NavigationState, replaceState: boolean = false): void
  {
    if (this.isRestoringState)
      return;
    
    const url = this.getUrlFromState(state);
    
    if (replaceState)
      history.replaceState(state, '', url);
    else
      history.pushState(state, '', url);
  }

  private getUrlFromState(state: NavigationState): string
  {
    switch (state.screen)
    {
      case 'menu':
        if (state.menuState === 'play') 
          return '/play';
        if (state.menuState === 'pong') 
          return '/play/pong';
        if (state.menuState === 'pacman') 
          return '/play/pacman';
        return '/';

      case 'profile':
        return '/profile';

      case 'tournament':
        return '/tournament';

      case 'game':
        if (state.gameMode === 'solo') 
          return '/game/pong/solo';
        if (state.gameMode === 'duo') 
          return '/game/pong/duo';
        if (state.gameMode === 'pacman') 
          return '/game/pacman/solo';
        if (state.gameMode === 'pacman-duo') 
          return '/game/pacman/duo';
        return '/game';
        
      default:
        return '/';
    }
  }

  private handleBrowserNavigation(e: PopStateEvent): void
  {
    const state = e.state as NavigationState;
    
    if (!state)
    {
      this.showMenu();
      return;
    }

    this.restoreState(state);
  }

  private restoreState(state: NavigationState): void
  {
    this.isRestoringState = true;
    
    this.cleanupAllScreens();
    
    switch (state.screen)
    {
      case 'menu':
        this.appState = "menu";
        this.menuScreen = new MenuScreen(this.canvas, this.currentUser ? {username: this.currentUser.username, wins: this.currentUser.wins, losses: this.currentUser.losses} : null, (action) => this.handleMenuAction(action));
        if (state.menuState)
          this.menuScreen.setMenuState(state.menuState);
        break;
        
      case 'profile':
        if (!this.currentUser && !state.data?.userId) {
             this.forceAuthScreen();
             return;
        }
        this.appState = "profile";
        const targetUserId = state.data?.userId;
        this.profileScreen = new ProfileScreen(this.canvas);
        break;
        
      case 'tournament':
        this.appState = "tournament";
        this.tournamentScreen = new TournamentScreen(this.canvas, (players, gameType) => this.startTournament(players, gameType), () => this.openTournamentAddPlayer(), () => this.exitTournament());
        break;
        
      case 'game':
        if (state.gameMode)
        {
          this.appState = "game";
          this.gameMode = state.gameMode;
          
          if (this.gameMode === "duo" || this.gameMode === "pacman-duo")
            this.player2AuthScreen = new Player2AuthScreen(this.canvas, (player2) => this.launchDuoGame(player2), () => this.launchDuoGame(null));
          else if (this.gameMode === "pacman")
            this.externalGame = new PacmanGame(this.canvas, "pacman", null, this.pacmanSettings);
          else if (this.gameMode === "solo")
            this.externalGame = new PongGame(this.canvas, this.gameMode, this.keys, null, this.pongSettings);
        }
        break;
    }
    
    this.isRestoringState = false;
  }

  private cleanupAllScreens(): void
  {
    if (this.menuScreen)
    {
      this.menuScreen.cleanup();
      this.menuScreen = null;
    }
    
    if (this.profileScreen)
    {
      this.profileScreen.cleanup();
      this.profileScreen = null;
    }
    
    if (this.tournamentScreen)
      this.tournamentScreen = null;
    
    if (this.tournamentAddPlayerScreen)
      this.tournamentAddPlayerScreen = null;
    
    if (this.tournamentBracket)
      this.tournamentBracket = null;
    
    if (this.tournamentMatchEndScreen)
      this.tournamentMatchEndScreen = null;
    
    if (this.customizationScreen)
    {
      this.customizationScreen.cleanup();
      this.customizationScreen = null;
    }
    
    if (this.pacmanCustomizationScreen)
    {
      this.pacmanCustomizationScreen.cleanup();
      this.pacmanCustomizationScreen = null;
    }
    
    if (this.externalGame)
      this.externalGame = null;
    
    if (this.player2AuthScreen)
      this.player2AuthScreen = null;
  }

  private handleAuthSuccess(e: CustomEvent): void
  {
    this.currentUser = e.detail as User;
    this.authScreen = null;
    this.showMenu();
  }

  private async initializeAuth(): Promise<void>
  {
    if (AuthService.isAuthenticated())
    {
      const isValid = await AuthGuard.checkAuth();
    
      if (isValid)
      {
        this.currentUser = AuthService.getCurrentUser();
        history.replaceState({ screen: 'menu', menuState: 'main' }, '', '/');
        this.showMenu();
     }
      else
      {
      this.forceAuthScreen();
      }
    }
    else
    {
     this.forceAuthScreen();
    }
  }

  private forceAuthScreen(): void
  {
    this.appState = "auth";
    this.authScreen = new AuthScreen(this.canvas);
    history.replaceState({ screen: 'auth' }, '', '/');
  }

  private handleForceLogout(): void
  {
    this.cleanupAllScreens();
    this.currentUser = null;
    this.gameMode = "none";
    this.forceAuthScreen();
  }

  private showMenu(): void
  {
    if (this.menuScreen)
    {
      this.menuScreen.cleanup();
      this.menuScreen = null;
    }
    
    this.appState = "menu";
    this.menuScreen = new MenuScreen(this.canvas, this.currentUser ? {username: this.currentUser.username, wins: this.currentUser.wins, losses: this.currentUser.losses} : null, (action) => this.handleMenuAction(action));
    
    this.navigate({ screen: 'menu', menuState: 'main' }, false);
  }

  private handleMenuAction(action: string): void
  {
    if (this.appState !== "menu" && this.menuScreen)
      this.appState = "menu";
    
    if (!this.menuScreen && !this.customizationScreen)
      return;
    
    switch (action)
    {
      case "play":
        this.menuScreen?.setMenuState("play");
        this.navigate({ screen: 'menu', menuState: 'play' });
        break;

      case "tournament":
        this.openTournamentSetup();
        break;

      case "logout":
        this.handleLogout();
        break;

      case "profile":
        this.openProfile();
        break;

      case "pong":
        this.menuScreen?.setMenuState("pong");
        this.navigate({ screen: 'menu', menuState: 'pong' });
        break;

      case "pacman":
        this.menuScreen?.setMenuState("pacman");
        this.navigate({ screen: 'menu', menuState: 'pacman' });
        break;

      case "pong-solo":
        this.gameMode = "solo";
        this.startGame();
        break;

      case "pong-duo":
        this.gameMode = "duo";
        this.startGame();
        break;

      case "pong-customize":
        this.openPongCustomization();
        break;

      case "pacman-solo":
        this.gameMode = "pacman";
        this.startGame();
        break;

      case 'pacman-duo':
        this.gameMode = "pacman-duo";
        this.startGame();
        break;

      case "pacman-customize":
        this.openPacmanCustomization();
        break;

      case "back":
        history.back();
        break;
    }
  }

  private async handleLogout(): Promise<void>
  {
    if (this.menuScreen)
    {
      this.menuScreen.cleanup();
      this.menuScreen = null;
    }
    
    if (this.profileScreen)
    {
      this.profileScreen.cleanup();
      this.profileScreen = null;
    }

    await AuthService.logout();
    this.currentUser = null;
    this.appState = "auth";
    this.authScreen = new AuthScreen(this.canvas);
    this.gameMode = "none";
  }

  private openPongCustomization(): void
  {
    if (this.menuScreen)
    {
      this.menuScreen.cleanup();
      this.menuScreen = null;
    }
    
    this.appState = "menu";
    this.customizationScreen = new CustomizationScreen(this.canvas, this.pongSettings, (settings) => this.closePongCustomization(settings));
  }

  private closePongCustomization(settings?: PongCustomization): void
  {
    if (settings)
      this.pongSettings = settings;
    
    if (this.customizationScreen)
    {
      this.customizationScreen.cleanup();
      this.customizationScreen = null;
    }
    
    this.showMenu();
    
    if (this.menuScreen)
    {
      this.menuScreen.setMenuState("pong");
      this.navigate({ screen: 'menu', menuState: 'pong' });
    }
  }

  private openPacmanCustomization(): void
  {
    if (this.menuScreen)
    {
      this.menuScreen.cleanup();
      this.menuScreen = null;
    }
    
    this.appState = "menu";
    this.pacmanCustomizationScreen = new PacmanCustomizationScreen(
      this.canvas,
      this.pacmanSettings,
      (settings) => this.closePacmanCustomization(settings)
    );
  }

  private closePacmanCustomization(settings?: PacmanCustomization): void
  {
    if (settings)
      this.pacmanSettings = settings;
    
    if (this.pacmanCustomizationScreen)
    {
      this.pacmanCustomizationScreen.cleanup();
      this.pacmanCustomizationScreen = null;
    }
    
    this.showMenu();
    
    if (this.menuScreen)
    {
      this.menuScreen.setMenuState("pacman");
      this.navigate({ screen: 'menu', menuState: 'pacman' });
    }
  }

  private async startGame(): Promise<void>
  {

    const canPlay = await AuthGuard.requireAuth();
    if (!canPlay)
    {
      this.showMenu();
      return;
    }

    if (this.menuScreen)
    {
      this.menuScreen.cleanup();
      this.menuScreen = null;
    }
    
    this.appState = "game";
    
    this.navigate({ screen: 'game', gameMode: this.gameMode });
    
    if (this.gameMode === "duo" || this.gameMode === "pacman-duo")
    {
      this.player2AuthScreen = new Player2AuthScreen(
        this.canvas,
        (player2) => this.launchDuoGame(player2),
        () => this.launchDuoGame(null)
      );
    }

    else if (this.gameMode === "pacman")
      this.externalGame = new PacmanGame(this.canvas, "pacman", null, this.pacmanSettings);
    else if (this.gameMode === "solo")
      this.externalGame = new PongGame(this.canvas, this.gameMode, this.keys, null, this.pongSettings);
  }

  private launchDuoGame(player2: any): void
  {
    this.player2AuthScreen = null;
    this.player2Info = player2;
    
    if (this.gameMode === "duo")
      this.externalGame = new PongGame(this.canvas, "duo", this.keys, player2, this.pongSettings);
    else if (this.gameMode === "pacman-duo")
      this.externalGame = new PacmanGame(this.canvas, "pacman-duo", player2, this.pacmanSettings);
  }

  private exitExternalGame(): void
  {
    this.externalGame = null;
    this.gameMode = "none";
    this.player2Info = null;
    this.showMenu();
  }

  private openProfile(): void
  {
    if (!this.currentUser) {
      console.warn("Tentative d'ouverture du profil sans utilisateur connecté.");
      this.handleLogout();
      return;
    }
    if (this.menuScreen)
    {
      this.menuScreen.cleanup();
      this.menuScreen = null;
    }
    
    this.appState = "profile";
    this.profileScreen = new ProfileScreen(this.canvas);
    
    this.navigate({ screen: 'profile' });
  }

  private exitProfile(): void
  {
    if (this.profileScreen)
    {
      this.profileScreen.cleanup();
      this.profileScreen = null;
    }
    
    this.showMenu();
  }

  private handleViewUserProfile(e: CustomEvent): void
{
  const userId = e.detail?.userId;
  if (!userId) return;
  if (this.menuScreen)
  {
    this.menuScreen.cleanup();
    this.menuScreen = null;
  }

  if (this.profileScreen)
  {
    this.profileScreen.cleanup();
    this.profileScreen = null;
  }

  this.appState = "profile";
  this.profileScreen = new ProfileScreen(this.canvas, userId);
  this.navigate({ screen: 'profile', data: { userId } });
}

  private openTournamentSetup(): void
  {
    if (this.menuScreen)
    {
      this.menuScreen.cleanup();
      this.menuScreen = null;
    }
    
    this.appState = "tournament";
    this.tournamentScreen = new TournamentScreen(this.canvas, (players, gameType) => this.startTournament(players, gameType), () => this.openTournamentAddPlayer(), () => this.exitTournament());
    
    this.navigate({ screen: 'tournament' });
  }

  private openTournamentAddPlayer(): void
  {
    this.appState = "tournamentAddPlayer";
    
    const existingAliases = this.tournamentScreen ? this.tournamentScreen.getPlayerAliases() : [];
    
    this.tournamentAddPlayerScreen = new TournamentAddPlayerScreen(this.canvas, existingAliases, (player) => this.handlePlayerAdded(player), () => this.backToTournamentSetup());
  }

  private handlePlayerAdded(player: TournamentPlayer): void
  {
    if (this.tournamentScreen)
    {
      const result = this.tournamentScreen.addPlayer(player);
      
      if (!result.success)
      {
        if (this.tournamentAddPlayerScreen)
          this.tournamentAddPlayerScreen.setError(result.error || 'Failed to add player');
        return;
      }
    }
    
    this.backToTournamentSetup();
  }

  private backToTournamentSetup(): void
  {
    if (this.tournamentAddPlayerScreen)
    {
      this.tournamentAddPlayerScreen.cleanup();
      this.tournamentAddPlayerScreen = null;
    }
    
    this.appState = "tournament";
  }

  private startTournament(players: TournamentPlayer[], gameType: 'pong' | 'pacman'): void
  {
    this.tournament = new Tournament(players);
    this.tournamentGameType = gameType;
    
    if (this.tournamentScreen)
    {
      this.tournamentScreen.cleanup();
      this.tournamentScreen = null;
    }
    
    this.tournamentBracket = new TournamentBracket(this.canvas, this.tournament, (match) => this.playTournamentMatch(match), () => this.exitTournament());
  }

  private playTournamentMatch(match: TournamentMatch): void
  {
    this.currentTournamentMatch = match;
    this.isTournamentMode = true;
    
    if (this.tournamentBracket)
    {
      this.tournamentBracket.cleanup();
      this.tournamentBracket = null;
    }
    
    this.appState = "game";
    
    this.navigate({ screen: 'game', gameMode: 'duo', data: { tournament: true } });
    
    const player1 = match.player1;
    const player2 = match.player2!;
    
    const tempPlayer1 = {alias: player1.alias, userId: player1.userId, isGuest: player1.isGuest};
    const tempPlayer2 = {alias: player2.alias, userId: player2.userId, isGuest: player2.isGuest};
    
    if (this.tournamentGameType === 'pong')
    {
      this.externalGame = new PongGame(this.canvas, "duo", this.keys, tempPlayer2, this.pongSettings, true, tempPlayer1);
      
      const handleMatchEnd = (e: Event) => {
        const customEvent = e as CustomEvent;
        const gameResult = customEvent.detail;
        
        this.showTournamentMatchEnd(player1, player2, gameResult.leftScore, gameResult.rightScore);
        
        window.removeEventListener("pong-game-over", handleMatchEnd);
      };
      
      window.addEventListener("pong-game-over", handleMatchEnd);
    }
    else
    {
      this.externalGame = new PacmanGame(this.canvas, "pacman-duo", tempPlayer2, this.pacmanSettings, true, tempPlayer1);
      
      const handleMatchEnd = (e: Event) => {
        const customEvent = e as CustomEvent;
        const gameResult = customEvent.detail;
        
        this.showTournamentMatchEnd(player1, player2, gameResult.player1Score, gameResult.player2Score);
        
        window.removeEventListener("pacman-game-over", handleMatchEnd);
      };
      
      window.addEventListener("pacman-game-over", handleMatchEnd);
    }
  }

  private showTournamentMatchEnd(player1: TournamentPlayer, player2: TournamentPlayer, leftScore: number, rightScore: number): void
  {
    if (this.externalGame)
    {
      this.externalGame.stop();
      this.externalGame = null;
    }
    
    const winner = leftScore > rightScore ? player1 : player2;
    
    this.appState = "tournamentMatchEnd";
    this.tournamentMatchEndScreen = new TournamentMatchEndScreen(
      this.canvas,
      {
        player1Name: player1.alias,
        player2Name: player2.alias,
        player1Score: leftScore,
        player2Score: rightScore,
        winnerName: winner.alias
      },
      () => this.continueTournament(winner)
    );
  }

  private continueTournament(winner: TournamentPlayer): void
  {
    if (!this.tournament || !this.currentTournamentMatch)
    {
      this.exitTournament();
      return;
    }
    
    if (this.tournamentMatchEndScreen)
    {
      this.tournamentMatchEndScreen.cleanup();
      this.tournamentMatchEndScreen = null;
    }
    
    this.tournament.recordMatchResult(this.currentTournamentMatch.id, winner);
    
    this.currentTournamentMatch = null;
    this.isTournamentMode = false;
    
    this.appState = "tournament";
    this.tournamentBracket = new TournamentBracket(this.canvas, this.tournament, (match) => this.playTournamentMatch(match), () => this.exitTournament());
  }

  private exitTournament(): void
  {
    if (this.tournamentScreen)
    {
      this.tournamentScreen.cleanup();
      this.tournamentScreen = null;
    }
    
    if (this.tournamentAddPlayerScreen)
    {
      this.tournamentAddPlayerScreen.cleanup();
      this.tournamentAddPlayerScreen = null;
    }
    
    if (this.tournamentBracket)
    {
      this.tournamentBracket.cleanup();
      this.tournamentBracket = null;
    }
    
    if (this.tournamentMatchEndScreen)
    {
      this.tournamentMatchEndScreen.cleanup();
      this.tournamentMatchEndScreen = null;
    }
    
    this.tournament = null;
    this.currentTournamentMatch = null;
    this.isTournamentMode = false;
    this.tournamentGameType = 'pong';
    this.showMenu();
  }

  private resize(): void
  {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    
    if (this.appState === "menu" && this.menuScreen)
      this.menuScreen.resize();
    else if (this.appState === "menu" && this.customizationScreen)
      this.customizationScreen.resize();
    else if (this.appState === "menu" && this.pacmanCustomizationScreen)
      this.pacmanCustomizationScreen.resize();
    else if (this.appState === "auth" && this.authScreen)
      this.authScreen.resize();
    else if (this.appState === "profile" && this.profileScreen)
      this.profileScreen.resize();
    else if (this.appState === "tournament" && this.tournamentScreen)
      this.tournamentScreen.resize();
    else if (this.appState === "tournament" && this.tournamentBracket)
      this.tournamentBracket.resize();
    else if (this.appState === "tournamentAddPlayer" && this.tournamentAddPlayerScreen)
      this.tournamentAddPlayerScreen.resize();
    else if (this.appState === "tournamentMatchEnd" && this.tournamentMatchEndScreen)
      this.tournamentMatchEndScreen.resize();
    else if (this.appState === "game" && this.externalGame && this.externalGame.resize)
    this.externalGame.resize();
  }

  private loop(): void
  {
    if (this.appState === "auth" && this.authScreen)
      this.authScreen.draw();
    else if (this.appState === "menu" && this.menuScreen)
      this.menuScreen.draw();
    else if (this.appState === "menu" && this.customizationScreen)
      this.customizationScreen.draw();
    else if (this.appState === "menu" && this.pacmanCustomizationScreen)
      this.pacmanCustomizationScreen.draw();
    else if (this.appState === "profile" && this.profileScreen) 
      this.profileScreen.draw();
    else if (this.appState === "game" && this.player2AuthScreen)
      this.player2AuthScreen.draw();
    else if (this.appState === "tournament" && this.tournamentScreen)
      this.tournamentScreen.draw();
    else if (this.appState === "tournament" && this.tournamentBracket)
      this.tournamentBracket.draw();
    else if (this.appState === "tournamentAddPlayer" && this.tournamentAddPlayerScreen)
      this.tournamentAddPlayerScreen.draw();
    else if (this.appState === "tournamentMatchEnd" && this.tournamentMatchEndScreen)
      this.tournamentMatchEndScreen.draw();
    
    requestAnimationFrame(() => this.loop());
  }
}