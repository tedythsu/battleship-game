import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

interface BoardCell {
  location: string;
  hasBeenShot: boolean;
  ship?: string;
}

interface Ship {
  name: string;
  size: number;
}

enum Direction {
  Right = 'Right',
  Left = 'Left',
  Up = 'Up',
  Down = 'Down',
}

@Component({
  selector: 'app-game-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './game-page.component.html',
  styleUrl: './game-page.component.scss'
})
export class GamePageComponent implements OnInit {

  alphabetLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  boardDimension: number = 8;
  boardCells: Array<BoardCell> = [];

  ships: Array<Ship> = [
    {name: 'Destroyer', size: 2},
    {name: 'Cruiser', size: 3},
    {name: 'Battleship', size: 4},
  ]

  ngOnInit(): void {
    this.startGame();
    console.log(this.boardCells);
  }

  public startGame(): void {
    this.generateGameBoard();
    this.generateShips()
  }

  private generateGameBoard(): void {
    this.boardCells = Array.from({length: Math.pow(this.boardDimension, 2)}, (_, index) => ({
      location: this.generateCellCoordinate(index + 1),
      hasBeenShot: false
    }));
  }

  private generateCellCoordinate(cellIndex: number): string {
    let columnIndex = cellIndex % this.boardDimension;
    if (columnIndex === 0) {
      columnIndex = this.boardDimension;
    }

    let rowIndex = Math.trunc(cellIndex / this.boardDimension);
    if (cellIndex % this.boardDimension === 0) {
      rowIndex -= 1;
    }

    return this.alphabetLetters[rowIndex] + columnIndex;
  }

  private generateShips(): void {
    let randomLocation: number;
    let randomDirection: string;

    this.ships.forEach((ship) => {
      let isShipPlacementValid = false;
      const maxAttempts = 100;
      let attempts = 0;

      while (!isShipPlacementValid) {
        randomLocation = this.getRandomLocation();
        randomDirection = this.getRandomDirection();
        console.log('船名', ship.name)
        console.log('隨機位置', randomLocation);
        console.log('隨機方向', randomDirection);
        isShipPlacementValid = this.isShipPlacementValid(randomLocation, randomDirection, ship.size);
        attempts++;
        if (attempts === maxAttempts) {
          break;
        }
      }

      this.placeShipOnBoard(randomLocation, randomDirection, ship.name, ship.size);
    })
  }

  private placeShipOnBoard(location: number, direction: string, name: string, size: number): void {
    let index: number;

    switch (direction) {
      case Direction.Right:
        index = 1;
        break;
      case Direction.Left:
        index = -1;
        break;
      case Direction.Up:
        index = -this.boardDimension;
        break;
      case Direction.Down:
        index = this.boardDimension;
        break;
      default:
        throw new Error('Invalid direction');
    }

    for (let i = 0; i < size; i++) {
      this.boardCells[location + i * index].ship = name;
    }
  }

  private getRandomLocation(): number {
    return Math.floor(Math.random() * this.boardCells.length);
  }

  private getRandomDirection(): string {
    const directions = [Direction.Up, Direction.Down, Direction.Right, Direction.Left];
    return directions[Math.floor(Math.random() * directions.length)];
  }

  private isShipPlacementValid(location: number, direction: string, size: number): boolean {
    const shipIndexes = this.generateShipIndexes(location, direction, size);
    console.log(shipIndexes);
    return this.isShipOutOfBounds(shipIndexes) || this.hasShipOverlap(shipIndexes) || this.hasShipDiscontinuity(shipIndexes, direction) ? false : true;
  }

  private generateShipIndexes(location: number, direction: string, size: number): number[] {
    let shipIndexes = [];

    for (let i = 0; i < size; i++) {
      switch (direction) {
        case Direction.Up:
          shipIndexes.push(location - this.boardDimension * i);
          break;
        case Direction.Right:
          shipIndexes.push(location + i);
          break;
        case Direction.Down:
          shipIndexes.push(location + this.boardDimension * i);
          break;
        case Direction.Left:
          shipIndexes.push(location - i);
          break;
      }
    }

    return shipIndexes;
  }

  /** Checks if any of the ship indexes are out of bounds on the game board. */
  private isShipOutOfBounds(shipIndexes: number[]): boolean {
    return shipIndexes.find(index => index >= this.boardCells.length || index < 0) !== undefined;
  }

  /** Checks if there is any ship overlap at the specified indexes on the game board. */
  private hasShipOverlap(shipIndexes: number[]): boolean {
    return shipIndexes.find(index => this.boardCells[index].ship) !== undefined;
  }

  /** Checks if ship placement in a specified direction results in a discontinuous placement. */
  private hasShipDiscontinuity(shipIndexes: number[], direction: string): boolean {
    if (direction === Direction.Right || direction === Direction.Left) {
      const startRow = Math.trunc(shipIndexes[0] / this.boardDimension);
      const endRow = Math.trunc(shipIndexes[shipIndexes.length - 1] / this.boardDimension)
      return startRow !== endRow;
    }
    return false;
  }

  public shoot(i: number): void {
    console.log(this.boardCells[i]);
    this.boardCells[i].hasBeenShot = true;
  }

}
