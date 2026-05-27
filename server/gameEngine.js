class GameEngine {
  constructor(board0, board1) {
    this.boards = [
      board0.map(cell => ({ ...cell, hasBeenShot: false })),
      board1.map(cell => ({ ...cell, hasBeenShot: false })),
    ];
  }

  processShot(defenderIndex, cellIndex) {
    const board = this.boards[defenderIndex];
    if (cellIndex < 0 || cellIndex >= board.length) return { error: 'Invalid cell' };
    if (board[cellIndex].hasBeenShot) return { error: 'Already shot' };

    board[cellIndex].hasBeenShot = true;
    const shipName = board[cellIndex].ship || null;
    const hit = !!shipName;
    const shipSunk = hit ? board.every(c => c.ship !== shipName || c.hasBeenShot) : false;
    const gameOver = board.every(c => !c.ship || c.hasBeenShot);

    return { cellIndex, hit, shipName, shipSunk, gameOver };
  }

  getBoard(index) {
    return this.boards[index];
  }
}

module.exports = { GameEngine };
