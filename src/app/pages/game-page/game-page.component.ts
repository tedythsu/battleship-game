import { Component, OnInit, Signal, WritableSignal, computed, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DatePipe } from '@angular/common';

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

enum ShotResult {
  HIT = 'TARGET HIT!',
  MISSED = 'MISSED!'
}

@Component({
  selector: 'app-game-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './game-page.component.html',
  styleUrl: './game-page.component.scss',
  providers: [DatePipe],
})
export class GamePageComponent implements OnInit {

  constructor(private datePipe: DatePipe) {
    // Check for game status
    effect(() => {
      if (this.remainingShipsCount() === 0) {
        this.generateMessage('VICTORY! ALL ENEMY SHIPS HAVE BEEN SUNK!');
      } else if (!this.isMissileEnough()) {
        this.generateMessage('GAME OVER: OUT OF MISSILE');
      }
    });
  }

  ships: Array<Ship> = [
    {name: 'Destroyer', size: 2},
    {name: 'Cruiser', size: 3},
    {name: 'Battleship', size: 4},
  ]

  alphabetLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  // Board Information
  numberOfPlayers: number = 2;
  boards: Array<Array<BoardCell>> = [[]];
  boardRows: WritableSignal<number> = signal(8);
  boardColumns: WritableSignal<number> = signal(8);
  boardTotalCells: Signal<number> = computed(() => this.boardRows() * this.boardColumns());
  boardRowsPx: Signal<string> = computed(() => 'calc(52 * ' + this.boardRows() + 'px)');
  boardColumnsPx: Signal<string> = computed(() => 'calc(52 * ' + this.boardColumns() + 'px)');

  isGameComplete: Signal<boolean> = computed(() => this.remainingShipsCount() === 0 || !this.isMissileEnough());
  isMissileEnough: Signal<boolean> = computed(() => this.missileCount() > 0);
  message: string = '';
  missileCount: WritableSignal<number> = signal(30);
  remainingShipsCount: WritableSignal<number> = signal(this.ships.length);

  get currentTimestamp(): string {
    return `[${this.datePipe.transform(new Date(), 'HH:mm:ss')}]`
  }

  ngOnInit(): void {
    this.startGame(this.numberOfPlayers);
    console.log('Boards Information', this.boards);
  }

  public startGame(numberOfPlayers: number): void {
    this.generateGameBoard(numberOfPlayers);

    for (let i = 0; i < numberOfPlayers; i++) {
      this.generateShips(i);
    }

    this.initializeGameData();
    this.generateMessage("---GAME STARTED---");
  }

  private generateGameBoard(numberOfPlayers: number): void {
    this.generateMessage('GENERATE GAME BOARD...');

    for (let i = 0; i < numberOfPlayers; i++) {
      const boardCells = Array.from({length: this.boardTotalCells()}, (_, index) => ({
        location: this.generateCellCoordinate(index + 1),
        hasBeenShot: false
      }));

      this.boards[i] = [...boardCells];
    }
  }

  private generateCellCoordinate(cellIndex: number): string {
    let columnIndex = cellIndex % this.boardColumns();
    if (columnIndex === 0) {
      columnIndex = this.boardColumns();
    }

    let rowIndex = Math.trunc(cellIndex / this.boardRows());
    if (cellIndex % this.boardRows() === 0) {
      rowIndex -= 1;
    }

    return this.alphabetLetters[rowIndex] + columnIndex;
  }

  private generateShips(boardIndex: number): void {
    this.generateMessage('GENERATE SHIPS...');
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
        isShipPlacementValid = this.isShipPlacementValid(boardIndex, randomLocation, randomDirection, ship.size);
        attempts++;
        if (attempts === maxAttempts) {
          break;
        }
      }

      this.placeShipOnBoard(randomLocation, randomDirection, ship.name, ship.size, boardIndex);
    })
  }

  private placeShipOnBoard(location: number, direction: string, name: string, size: number, boardIndex: number): void {
    let index: number;

    switch (direction) {
      case Direction.Right:
        index = 1;
        break;
      case Direction.Left:
        index = -1;
        break;
      case Direction.Up:
        index = -this.boardRows();
        break;
      case Direction.Down:
        index = this.boardRows();
        break;
      default:
        throw new Error('Invalid direction');
    }

    for (let i = 0; i < size; i++) {
      this.boards[boardIndex][location + i * index].ship = name;
    }
  }

  private getRandomLocation(): number {
    return Math.floor(Math.random() * this.boardTotalCells());
  }

  private getRandomDirection(): string {
    const directions = [Direction.Up, Direction.Down, Direction.Right, Direction.Left];
    return directions[Math.floor(Math.random() * directions.length)];
  }

  private isShipPlacementValid(board: number, location: number, direction: string, size: number): boolean {
    const shipIndexes = this.generateShipIndexes(location, direction, size);
    console.log(shipIndexes);
    return this.isShipOutOfBounds(shipIndexes) || this.hasShipOverlap(board, shipIndexes) || this.hasShipDiscontinuity(shipIndexes, direction) ? false : true;
  }

  private generateShipIndexes(location: number, direction: string, size: number): number[] {
    let shipIndexes = [];

    for (let i = 0; i < size; i++) {
      switch (direction) {
        case Direction.Up:
          shipIndexes.push(location - this.boardRows() * i);
          break;
        case Direction.Right:
          shipIndexes.push(location + i);
          break;
        case Direction.Down:
          shipIndexes.push(location + this.boardRows() * i);
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
    return shipIndexes.find(index => index >= this.boardTotalCells() || index < 0) !== undefined;
  }

  /** Checks if there is any ship overlap at the specified indexes on the game board. */
  private hasShipOverlap(board: number, shipIndexes: number[]): boolean {
    return shipIndexes.find(index => this.boards[board][index].ship) !== undefined;
  }

  /** Checks if ship placement in a specified direction results in a discontinuous placement. */
  private hasShipDiscontinuity(shipIndexes: number[], direction: string): boolean {
    if (direction === Direction.Right || direction === Direction.Left) {
      const startRow = Math.trunc(shipIndexes[0] / this.boardRows());
      const endRow = Math.trunc(shipIndexes[shipIndexes.length - 1] / this.boardRows())
      return startRow !== endRow;
    }
    return false;
  }

  private initializeGameData(): void {
    this.generateMessage('INITIALIZE GAME DATA...');
    this.remainingShipsCount.set(this.ships.length);
    this.missileCount.set(30);
  }

  public shoot(boardIndex: number, cellIndex: number): void {
    this.missileCount.update(count => count - 1);
    const target = this.boards[boardIndex][cellIndex];
    target.hasBeenShot = true;

    if (target.ship) {
      this.generateMessage(`FIRE AT [${target.location}] - ${ShotResult.HIT}`);
      this.checkIfShipSunk(boardIndex, target.ship);
    } else {
      this.generateMessage(`FIRE AT [${target.location}] - ${ShotResult.MISSED}`);
    }
  }

  private generateMessage(content: string): void {
    this.message += `\n${this.currentTimestamp}: ${content}\n`;
  }

  private checkIfShipSunk(boardIndex: number, shipName: string): void {
    const isShipSunk = this.boards[boardIndex].find(cell => cell.ship === shipName && !cell.hasBeenShot) === undefined;
    if (isShipSunk) {
      this.remainingShipsCount.update(count => count - 1);
      this.generateMessage(`THE SHIP [${shipName}] HAS BEEN SUNK!`);
    }
  }
}
