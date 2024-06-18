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
        const actualShipsCount: number = component.players[0].remainingShips();
        const expectedShipsCount: number = component.ships.length;
        // Assert
        expect(actualShipsCount).toBe(expectedShipsCount);
      });

      it('should initialize missile counts for the player in single player mode', () => {
        const actualMissilesCount: number = component.players[0].missileCount();
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

      xit('should initialize remaining ships for players in multiplayer mode', () => {
        // Test initialization of remaining ships for players in multiplayer mode
      });

      xit('should initialize missile counts for players in multiplayer mode', () => {
        // Test initialization of missile counts for players in multiplayer mode
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

      xit('should correctly check if a ship is sunk in single player mode', () => {
        // Test logic for checking if a ship is correctly sunk in single player mode
      });

      it('should handle game status correctly when all enemy ships are sunk in single player mode', () => {
        // Arrange
        let alertService: AlertService;
        alertService = TestBed.inject(AlertService);
        spyOn(alertService, 'showModal');
        component.isAnyPlayerAllShipsSunk = signal(true);
        // Act
        component.shoot(0, 0);
        // Assert
        const expectedMessage = 'VICTORY! ALL ENEMY SHIPS HAVE BEEN SUNK!';
        expect(alertService.showModal).toHaveBeenCalledWith(expectedMessage);
      });

      it('should handle game status correctly when player runs out of missiles in single player mode', () => {
        // Arrange
        let alertService: AlertService;
        alertService = TestBed.inject(AlertService);
        spyOn(alertService, 'showModal');
        component.players[0].missileCount.set(1);
        // Act
        component.shoot(0, 0);
        // Assert
        const expectedMessage = 'GAME OVER: OUT OF MISSILE';
        expect(alertService.showModal).toHaveBeenCalledWith(expectedMessage);
      });

      it('should correctly decrease player missile count after shooting in single player mode', () => {
        // Arrange
        const initialMissilesCount: number = component.players[0].missileCount();
        // Act
        component.shoot(0, 0);
        // Assert
        const updatedMissilesCount: number = component.players[0].missileCount();
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

      xit('should correctly check if a ship is sunk in multiplayer mode', () => {
        // Test logic for checking if a ship is correctly sunk in multiplayer mode
      });

      xit('should handle game status correctly when all ships of one player are sunk in multiplayer mode', () => {
        // Test game status handling when all ships of one player are sunk
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
