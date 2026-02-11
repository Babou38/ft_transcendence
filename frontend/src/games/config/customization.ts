export interface PongCustomization
{
  powerUpsEnabled: boolean;
  ballSpeed: 'slow' | 'normal' | 'fast';
  winScore: 3 | 5 | 7 | 10;
  obstacles: boolean;
}

export const DEFAULT_PONG_CUSTOMIZATION: PongCustomization = {
  powerUpsEnabled: false,
  ballSpeed: 'normal',
  winScore: 5,
  obstacles: false
};

export const BALL_SPEED_MULTIPLIERS = {
  slow: 0.7,
  normal: 1.0,
  fast: 1.3
} as const;

export type PongPowerUpType = 'paddle_grow' | 'paddle_shrink' | 'speed_boost' | 'slow_motion';

export interface ActivePowerUp
{
  type: PongPowerUpType;
  player: 'left' | 'right';
  endTime: number;
}

export const POWERUP_CONFIG = {
  DURATION: 5000,
  SPAWN_INTERVAL: 15000,
  
  PADDLE_GROW_MULTIPLIER: 1.5,
  PADDLE_SHRINK_MULTIPLIER: 0.6,
  SPEED_BOOST_MULTIPLIER: 1.4,
  SLOW_MOTION_MULTIPLIER: 0.6
} as const;

export interface Obstacle
{
  x: number;
  y: number;
  width: number;
  height: number;
}

export function generateObstacles(canvasWidth: number, canvasHeight: number): Obstacle[]
{
  const centerX = canvasWidth / 2;
  const centerY = canvasHeight / 2;
  
  return [{x: centerX - 30, y: centerY - 150, width: 60, height: 80}, {x: centerX - 30, y: centerY + 70, width: 60, height: 80}];
}
