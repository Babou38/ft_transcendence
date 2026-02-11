export type CellType = "wall" | "pellet" | "powerPellet" | "empty";
export type Direction = "up" | "down" | "left" | "right";
export type GhostColor = "red" | "pink" | "cyan";

export interface Position {
  x: number;
  y: number;
}