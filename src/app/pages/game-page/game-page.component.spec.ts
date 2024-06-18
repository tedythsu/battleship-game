import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GameMode, GamePageComponent } from './game-page.component';
import { AlertService } from 'src/app/core/services/alert.service';
import { signal } from '@angular/core';

describe('GamePageComponent', () => {
  let component: GamePageComponent;
  let fixture: ComponentFixture<GamePageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GamePageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GamePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization', () => {
    describe('Single Player Mode', () => {
      beforeEach(() => {
        component.gameMode = GameMode.SINGLE_PLAYER;
        component.startGame(component.gameMode);
      })

      xit('should initialize game mode correctly for single player mode', () => {
        // Test initialization of game mode, ensuring it defaults correctly for single player mode
      });

      it('should generate players correctly for single player mode', () => {
        const actualPlayersCount: number = component.players.length;
        const expectedPlayersCount: number = 1;
        // Assert
        expect(actualPlayersCount).toBe(expectedPlayersCount);
      });

      it('should generate game boards correctly for single player mode', () => {
        const actualBoardsCount: number = component.boards.length;
        const expectedBoardsCount: number = 1;
        // Assert
        expect(actualBoardsCount).toBe(expectedBoardsCount);
      });

      it('should initialize remaining ships for the player in single player mode', () => {
        const playerOneIndex = 0;
        const actualShipsCount: number = component.players[playerOneIndex].remainingShips();
        const expectedShipsCount: number = component.ships.length;
        // Assert
        expect(actualShipsCount).toBe(expectedShipsCount);
      });

      it('should initialize missile counts for the player in single player mode', () => {
        const playerOneIndex = 0;
        const actualMissilesCount: number = component.players[playerOneIndex].missileCount();
        const expectedMissilesCount: number = 30;
        // Assert
        expect(actualMissilesCount).toBe(expectedMissilesCount);
      });
    });

    describe('Multiplayer Mode', () => {
      beforeEach(() => {
        component.gameMode = GameMode.MULTI_PLAYER;
        component.startGame(component.gameMode);
      })

      xit('should initialize game mode correctly for multiplayer mode', () => {
        // Test initialization of game mode, ensuring it defaults correctly for multiplayer mode
      });

      it('should generate players correctly for multiplayer mode', () => {
        const actualPlayersCount: number = component.players.length;
        const expectedPlayersCount: number = 2;
        // Assert
        expect(actualPlayersCount).toBe(expectedPlayersCount);
      });

      it('should generate game boards correctly for multiplayer mode', () => {
        const actualBoardsCount: number = component.boards.length;
        const expectedBoardsCount: number = 2;
        // Assert
        expect(actualBoardsCount).toBe(expectedBoardsCount);
      });

      it('should initialize remaining ships for players in multiplayer mode', () => {
        const playerOneIndex = 0;
        const playerTwoIndex = 1;
        const actualPlayerOneShipsCount: number = component.players[playerOneIndex].remainingShips();
        const actualPlayerTwoShipsCount: number = component.players[playerTwoIndex].remainingShips();
        const expectedShipsCount: number = component.ships.length;
        // Assert
        expect(actualPlayerOneShipsCount).toBe(expectedShipsCount);
        expect(actualPlayerTwoShipsCount).toBe(expectedShipsCount);
      });
    });
  });

  describe('Game Operations', () => {
    describe('Single Player Mode', () => {
      beforeEach(() => {
        component.gameMode = GameMode.SINGLE_PLAYER;
        component.startGame(component.gameMode);
      })

      it('should mark the target cell as shot when shooting in single player mode', () => {
        // Arrange
        const boardIndex = 0;
        const cellIndex = 0;
        component.boards[boardIndex][cellIndex].hasBeenShot = false;
        // Act
        component.shoot(boardIndex, cellIndex);
        // Assert
        const cellHasBeenShot = component.boards[boardIndex][cellIndex].hasBeenShot;
        expect(cellHasBeenShot).toBeTrue();
      });

      it('should correctly check if a ship is sunk in single player mode', () => {
        // Arrange
        const boardIndex = 0;
        const cellIndex = 0;
        const mockShip = 'mockShip';
        const playerOneIndex = 0;
        component.boards[boardIndex][cellIndex].ship = mockShip;
        // Act
        component.shoot(boardIndex, cellIndex);
        // Assert
        const actualRemainingShips = component.players[playerOneIndex].remainingShips();
        const expectedRemainingShips = component.ships.length - 1;
        expect(actualRemainingShips).toBe(expectedRemainingShips);
      });

      it('should handle game status correctly when all enemy ships are sunk in single player mode', () => {
        // Arrange
        let alertService: AlertService;
        alertService = TestBed.inject(AlertService);
        spyOn(alertService, 'showModal');
        component.isAnyPlayerAllShipsSunk = signal(true);
        const boardIndex = 0;
        const cellIndex = 0;
        // Act
        component.shoot(boardIndex, cellIndex);
        // Assert
        const expectedMessage = 'VICTORY! ALL ENEMY SHIPS HAVE BEEN SUNK!';
        expect(alertService.showModal).toHaveBeenCalledWith(expectedMessage);
      });

      it('should handle game status correctly when player runs out of missiles in single player mode', () => {
        // Arrange
        const playerOneIndex = 0;
        const boardIndex = 0;
        const cellIndex = 0;
        const initialMissilesCount = 1;
        let alertService: AlertService;
        alertService = TestBed.inject(AlertService);
        spyOn(alertService, 'showModal');
        component.players[playerOneIndex].missileCount.set(initialMissilesCount);
        // Act
        component.shoot(boardIndex, cellIndex);
        // Assert
        const expectedMessage = 'GAME OVER: OUT OF MISSILE';
        expect(alertService.showModal).toHaveBeenCalledWith(expectedMessage);
      });

      it('should correctly decrease player missile count after shooting in single player mode', () => {
        // Arrange
        const playerOneIndex = 0;
        const boardIndex = 0;
        const cellIndex = 0;
        const initialMissilesCount: number = component.players[playerOneIndex].missileCount();
        // Act
        component.shoot(boardIndex, cellIndex);
        // Assert
        const updatedMissilesCount: number = component.players[playerOneIndex].missileCount();
        expect(updatedMissilesCount).toBe(initialMissilesCount - 1);
      });
    });

    describe('Multiplayer Mode', () => {
      beforeEach(() => {
        component.gameMode = GameMode.MULTI_PLAYER;
        component.startGame(component.gameMode);
      })

      it('should mark the target cell as shot when shooting in multiplayer mode', () => {
        // Arrange
        const boardIndex = 1
        const cellIndex = 0;
        component.boards[boardIndex][cellIndex].hasBeenShot = false;
        // Act
        component.shoot(boardIndex, cellIndex);
        // Assert
        const cellHasBeenShot = component.boards[boardIndex][cellIndex].hasBeenShot;
        expect(cellHasBeenShot).toBeTrue();
      });

      it('should correctly check if a ship is sunk in multiplayer mode', () => {
        // Arrange
        const boardIndex = 1;
        const cellIndex = 0;
        const mockShip = 'mockShip';
        const playerTwoIndex = 1;
        component.boards[boardIndex][cellIndex].ship = mockShip;
        // Act
        component.shoot(boardIndex, cellIndex);
        // Assert
        const actualRemainingShips = component.players[playerTwoIndex].remainingShips();
        const expectedRemainingShips = component.ships.length - 1;
        expect(actualRemainingShips).toBe(expectedRemainingShips);
      });

      it('should handle game status correctly when all ships of player 1 are sunk in multiplayer mode', () => {
        // Arrange
        const playerOneIndex = 0;
        const boardIndex = 0;
        const cellIndex = 0;
        const initialRemainingShipsCount = 0;
        let alertService: AlertService;
        alertService = TestBed.inject(AlertService);
        spyOn(alertService, 'showModal');
        component.players[playerOneIndex].remainingShips.set(initialRemainingShipsCount);
        // Act
        component.shoot(boardIndex, cellIndex);
        // Assert
        const expectedMessage = 'PLAYER 2 WINS!';
        expect(alertService.showModal).toHaveBeenCalledWith(expectedMessage);
      });

      it('should handle game status correctly when all ships of player 2 are sunk in multiplayer mode', () => {
        // Arrange
        const playerTwoIndex = 1;
        const boardIndex = 1;
        const cellIndex = 0;
        const initialRemainingShipsCount = 0;
        let alertService: AlertService;
        alertService = TestBed.inject(AlertService);
        spyOn(alertService, 'showModal');
        component.players[playerTwoIndex].remainingShips.set(initialRemainingShipsCount);
        // Act
        component.shoot(boardIndex, cellIndex);
        // Assert
        const expectedMessage = 'PLAYER 1 WINS!';
        expect(alertService.showModal).toHaveBeenCalledWith(expectedMessage);
      });

      it('should correctly switch player turns from player 1 to player 2 after shooting in multiplayer mode', () => {
        // Arrange
        const cellIndex = 0;
        const playerOneIndex = 0;
        const playerTwoIndex = 1;
        component.players[playerOneIndex].isTurn = true;
        component.players[playerTwoIndex].isTurn = false;
        // Act
        component.shoot(playerTwoIndex, cellIndex);
        // Assert
        expect(component.players[playerOneIndex].isTurn).toBeFalse();
        expect(component.players[playerTwoIndex].isTurn).toBeTrue();
      });

      it('should correctly switch player turns from player 2 to player 1 after shooting in multiplayer mode', () => {
        // Arrange
        const cellIndex = 0;
        const playerOneIndex = 0;
        const playerTwoIndex = 1;
        component.players[playerOneIndex].isTurn = false;
        component.players[playerTwoIndex].isTurn = true;
        // Act
        component.shoot(playerOneIndex, cellIndex);
        // Assert
        expect(component.players[playerOneIndex].isTurn).toBeTrue();
        expect(component.players[playerTwoIndex].isTurn).toBeFalse();
      });
    });
  });
});
