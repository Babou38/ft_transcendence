export interface PacmanCustomization
{
  powerUpsEnabled: boolean;
  startingLives: 1 | 3 | 5;
  ghostSpeed: 'slow' | 'normal' | 'fast';
}

export const DEFAULT_PACMAN_CUSTOMIZATION: PacmanCustomization = {
  powerUpsEnabled: false,
  startingLives: 3,
  ghostSpeed: 'normal'
};

export const GHOST_SPEED_MULTIPLIERS = {
  slow: 1.5,   
  normal: 1.0,
  fast: 0.6  
} as const;

export type PacmanPowerUpType = 'super_speed' | 'ghost_freeze' | 'extra_life';

export interface PacmanPowerUp
{
  type: PacmanPowerUpType;
  x: number; 
  y: number;
  active: boolean;
}

export interface ActivePacmanPowerUp
{
  type: PacmanPowerUpType;
  player: 1 | 2;
  endTime: number;
}

export const PACMAN_POWERUP_CONFIG = {
  SUPER_SPEED_DURATION: 3000,     
  GHOST_FREEZE_DURATION: 2000,    
  SUPER_SPEED_MULTIPLIER: 0.5,   
  
  COLORS: {
    super_speed: '#ff0000',   
    ghost_freeze: '#00ffff',   
    extra_life: '#00ff00' 
  },
  
  SPRITES: {
    super_speed: '/pacman/sprites/lightning.png',   
    ghost_freeze: '/pacman/sprites/ice.png',         
    extra_life: '/pacman/sprites/heart.png'         
  }
} as const;

export function generatePacmanPowerUps(maze: any): PacmanPowerUp[]
{
  const powerUps: PacmanPowerUp[] = [];
  const types: PacmanPowerUpType[] = ['super_speed', 'ghost_freeze', 'extra_life', 'super_speed'];
  
  const validPositions = [
    { x: 5, y: 5 },
    { x: 23, y: 5 },
    { x: 5, y: 20 },
    { x: 23, y: 20 }
  ];
  
  validPositions.forEach((pos, i) => {
    powerUps.push({type: types[i], x: pos.x, y: pos.y, active: true});
  });
  
  return powerUps;
}