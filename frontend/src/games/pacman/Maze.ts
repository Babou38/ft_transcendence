import { CellType } from "./types";
import { PACMAN_CONFIG } from "../config/config";

const MAZE_LAYOUT = [
  "1111111111111111111111111111",
  "1222222222222112222222222221",
  "1211112111112112111112111121",
  "1P111121111121121111121111P1",
  "1211112111112112111112111121",
  "1222222222222222222222222221",
  "1211112112111111112112111121",
  "1211112112111111112112111121",
  "1222222112222112222112222221",
  "1111112111110110111112111111",
  "0000012111110110111112100000",
  "0000012110000000000112100000",
  "0000012110111001110112100000",
  "1111112110111001110112111111",
  "0000002000110000110002000000",
  "1111112110111111110112111111",
  "0000012110111111110112100000",
  "0000012110000000000112100000",
  "0000012110111111110112100000",
  "1111112110111111110112111111",
  "1222222222222112222222222221",
  "1211112111112112111112111121",
  "1211112111112112111112111121",
  "1P221122222222222222221122P1",
  "1112112112111111112112112111",
  "1112112112111111112112112111",
  "1222222112222112222112222221",
  "1211111111112112111111111121",
  "1211111111112112111111111121",
  "1222222222222222222222222221",
  "1111111111111111111111111111",
];

export class Maze
{
  grid: CellType[][];
  
  width: number;
  height: number;
  
  startX = 14;
  startY = 23;
  
  offsetX = 0;
  offsetY = 0;

  private image: HTMLImageElement;

  constructor()
  {
    this.height = MAZE_LAYOUT.length;
    this.width = MAZE_LAYOUT[0].length;
    this.grid = this.parseLayout();
    this.image = this.loadSprite();
  }

  private parseLayout(): CellType[][]
  {
    return MAZE_LAYOUT.map((row) =>
      row.split("").map((char) => {
        switch (char) {
          case "1":
            return "wall";        
          case "2":
            return "pellet";
          case "P":
            return "powerPellet";
          default:
            return "empty";
        }
      })
    );
  }

  private loadSprite(): HTMLImageElement
  {
    const img = new Image();
    img.src = PACMAN_CONFIG.SPRITES.MAZE;
    return img;
  }

  resize(canvasWidth: number, canvasHeight: number): void
  {
    const mazeWidthPx = this.width * PACMAN_CONFIG.TILE_SIZE;
    const mazeHeightPx = this.height * PACMAN_CONFIG.TILE_SIZE;
    
    this.offsetX = (canvasWidth - mazeWidthPx) / 2;
    this.offsetY = (canvasHeight - mazeHeightPx) / 2;
  }

  isWall(x: number, y: number): boolean
  {
    if (y < 0 || y >= this.height || x < 0 || x >= this.width) 
      return true;
    
    return this.grid[y][x] === "wall";
  }

  eatPellet(x: number, y: number): "none" | "pellet" | "powerPellet"
  {
    const cell = this.grid[y][x];
    
    if (cell === "pellet" || cell === "powerPellet")
    {
      this.grid[y][x] = "empty";
      return cell;
    }
    return "none";
  }

  remainingPellets(): number
  {
    let count = 0;
    for (const row of this.grid)
    {
      for (const cell of row)
      {
        if (cell === "pellet" || cell === "powerPellet") 
          count++;
      }
    }
    return count;
  }

  draw(ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number): void
  {
    this.resize(canvasWidth, canvasHeight);

    const mazeWidthPx = this.width * PACMAN_CONFIG.TILE_SIZE;
    const mazeHeightPx = this.height * PACMAN_CONFIG.TILE_SIZE;

    if (this.image.complete)
      ctx.drawImage(this.image, this.offsetX, this.offsetY, mazeWidthPx, mazeHeightPx);
    else
    {
      this.image.onload = () => {
        ctx.drawImage(this.image, this.offsetX, this.offsetY, mazeWidthPx, mazeHeightPx);
      };
    }

    this.drawPellets(ctx);
  }

  private drawPellets(ctx: CanvasRenderingContext2D): void
  {
    for (let y = 0; y < this.height; y++)
    {
      for (let x = 0; x < this.width; x++)
      {
        const cell = this.grid[y][x];
        const px = this.offsetX + x * PACMAN_CONFIG.TILE_SIZE;
        const py = this.offsetY + y * PACMAN_CONFIG.TILE_SIZE;
        const centerX = px + PACMAN_CONFIG.TILE_SIZE / 2;
        const centerY = py + PACMAN_CONFIG.TILE_SIZE / 2;

        ctx.fillStyle = "white";
        ctx.beginPath();

        if (cell === "pellet")
          ctx.arc(centerX, centerY, 3, 0, Math.PI * 2);
        else if (cell === "powerPellet")
          ctx.arc(centerX, centerY, 9, 0, Math.PI * 2);

        if (cell === "pellet" || cell === "powerPellet")
          ctx.fill();
      }
    }
  }
}