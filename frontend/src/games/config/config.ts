export const GAME_CONFIG = {
  CANVAS: {
    BACKGROUND_COLOR: '#000000',
  },
  
  MENU: {
    TITLE: 'Transcendence',
    
    TITLE_FONT_SIZE: 50,
    OPTION_FONT_SIZE: 30,   
    HINT_FONT_SIZE: 18,
    
    HOVER_COLOR: '#00ffff',  
    DEFAULT_COLOR: '#ffffff',
    HINT_COLOR: '#888888',
    
    ITEM_HEIGHT: 50,          
    ITEM_WIDTH: 400,           
    BUTTON_HEIGHT: 40,        
    TEXT_OFFSET_Y: 24,       
    BUTTON_PADDING: 10,  
  },
} as const;

export const PONG_CONFIG = {

  BALL: {
    RADIUS: 10,                       
    BASE_SPEED: 800,                
    SPEED_MULTIPLIER: 1.05,          
    INITIAL_DIRECTION_Y_RANGE: 0.8,    
  },
  
  PADDLE: {
    WIDTH: 12,     
    HEIGHT: 100,  
    SPEED: 8,    
    MARGIN: 40,     
  },
  
  GAME: {
    WIN_SCORE: 5,                  
    CENTER_LINE_DASH: [10, 10],  
    SCORE_FONT_SIZE: 32,            
    SCORE_OFFSET_X: 100,            
    SCORE_OFFSET_Y: 60,            
    GAME_OVER_FONT_SIZE: 40,     
  },
  
  AI: {
    TICK_INTERVAL_MS: 1000,         
    
    AIM_ERROR_RANGE: 40,           
    
    MOVEMENT_THRESHOLD: 10,         
    
    MIN_DURATION_MS: 120,           
    MAX_DURATION_MS: 900,          
    
    MISS_PROBABILITY: 0.1,          
    
    MAX_PREDICTION_ITERATIONS: 10000,
  },
} as const;

export const CONTROLS = {
  PONG: {
    LEFT_PLAYER: {
      UP: 'z',      
      DOWN: 's',   
    },
    RIGHT_PLAYER: {
      UP: 'ArrowUp',    
      DOWN: 'ArrowDown', 
    },
  },

  PACMAN: {
    PLAYER1: {
      UP: 'w',
      DOWN: 's',
      LEFT: 'a',
      RIGHT: 'd',
    },
    PLAYER2: {
      UP: 'ArrowUp',
      DOWN: 'ArrowDown',
      LEFT: 'ArrowLeft',
      RIGHT: 'ArrowRight',
    },
  },

  MENU: {
    SELECT_1: '1', 
    SELECT_2: '2', 
    SELECT_3: '3', 
    START: ' ', 
    RETURN: 'r', 
  },
} as const;

export const PACMAN_CONFIG = {
  TILE_SIZE: 24,
  
  GAME: {
    INITIAL_LIVES: 3,          
    RESPAWN_DELAY_MS: 1500,       
    VULNERABLE_DURATION_MS: 5000,
  },
  
  PACMAN: {
    MOVE_DELAY_MS: 120,      
    FRAME_COUNT: 3,         
    FRAME_DELAY_MS: 100,   
    SCALE: 1.2,       
    SPRITE_WIDTH: 32,        
    SPRITE_HEIGHT: 32,     
    DEATH_FRAME_COUNT: 12,  
    DEATH_FRAME_DELAY_MS: 100, 
  },
  
  GHOST: {
    SPAWN_DELAY_MS: 2500,         
    MOVE_DELAY_MS: 200,          
    FRAME_COUNT: 2,              
    ANIM_DELAY_MS: 150,   
    SCALE: 1.3,                  
    SPRITE_FRAME_WIDTH: 15.75,   
    SPRITE_FRAME_HEIGHT: 15.5,  
    VULNERABLE_SPRITE_WIDTH: 15,
    VULNERABLE_SPRITE_HEIGHT: 15,
    BLINK_START_MS: 2000,        
    BLINK_INTERVAL_MS: 200,      
  },

  SCORE: {
    PELLET: 10,        
    POWER_PELLET: 50, 
    GHOST: 200,       
    EAT_PLAYER: 200,  
    LIFE_BONUS: 500
  },

  SOUND: {
    WAKA_VOLUME: 0.4,    
    INTRO_VOLUME: 0.5,   
    DEATH_VOLUME: 0.6,    
    WAKA_INTERVAL_MS: 180, 
  },

  SPRITES: {
    PACMAN: '/pacman/sprites/Pac_man.png',    
    PACMAN_PLAYER2: '/pacman/sprites/Pac_man_player_2.png',
    DEATH: '/pacman/sprites/Death.png',       
    DEATH_PLAYER2: '/pacman/sprites/Death_2.png',    
    GHOST: '/pacman/sprites/Ghost.png',     
    VULNERABLE: '/pacman/sprites/Vulnerable.png',
    MAZE: '/pacman/sprites/maze.png',        
  },

  SOUNDS: {
    WAKA: '/pacman/sounds/pacman_chomp.wav',    
    INTRO: '/pacman/sounds/pacman_beginning.wav',
    DEATH: '/pacman/sounds/pacman_death.wav',    
  },
} as const;



export type GameMode = 'none' | 'solo' | 'duo' | 'pacman' | 'pacman-duo';
export type GameState = 'menu' | 'external';
export type PongState = 'playing' | 'gameover';
export type PacmanState = 'intro' | 'playing' | 'dead' | 'gameover' | 'victory';
export type GhostColor = 'red' | 'pink' | 'cyan';
export type Direction = 'up' | 'down' | 'left' | 'right';
export type CellType = 'wall' | 'pellet' | 'powerPellet' | 'empty';