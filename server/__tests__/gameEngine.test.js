const { GameEngine } = require('../gameEngine');

function makeBoard(shipCells) {
  return Array.from({ length: 64 }, (_, i) => {
    const s = shipCells.find(c => c.index === i);
    return { location: `X${i}`, hasBeenShot: false, ship: s ? s.ship : undefined };
  });
}

describe('GameEngine', () => {
  test('miss when cell has no ship', () => {
    const engine = new GameEngine(makeBoard([]), makeBoard([{ index: 10, ship: 'D' }]));
    const r = engine.processShot(1, 0);
    expect(r.hit).toBe(false);
    expect(r.shipSunk).toBe(false);
    expect(r.gameOver).toBe(false);
  });

  test('hit when cell has ship', () => {
    const engine = new GameEngine(makeBoard([]), makeBoard([{ index: 10, ship: 'D' }, { index: 11, ship: 'D' }]));
    const r = engine.processShot(1, 10);
    expect(r.hit).toBe(true);
    expect(r.shipName).toBe('D');
    expect(r.shipSunk).toBe(false);
  });

  test('sunk when all ship cells hit', () => {
    const engine = new GameEngine(makeBoard([]), makeBoard([{ index: 10, ship: 'D' }, { index: 11, ship: 'D' }]));
    engine.processShot(1, 10);
    const r = engine.processShot(1, 11);
    expect(r.shipSunk).toBe(true);
  });

  test('gameOver when all ships sunk', () => {
    const engine = new GameEngine(makeBoard([]), makeBoard([{ index: 0, ship: 'D' }]));
    const r = engine.processShot(1, 0);
    expect(r.gameOver).toBe(true);
  });

  test('error on already-shot cell', () => {
    const engine = new GameEngine(makeBoard([]), makeBoard([]));
    engine.processShot(1, 0);
    expect(engine.processShot(1, 0).error).toBe('Already shot');
  });

  test('error on invalid cell index', () => {
    const engine = new GameEngine(makeBoard([]), makeBoard([]));
    expect(engine.processShot(1, 999).error).toBe('Invalid cell');
  });
});
