const { RoomManager } = require('../roomManager');

const BOARD = Array.from({ length: 64 }, (_, i) => ({
  location: `X${i}`, hasBeenShot: false,
  ship: i === 0 ? 'Destroyer' : undefined,
}));

describe('RoomManager', () => {
  test('createRoom returns 4-char code', () => {
    const rm = new RoomManager();
    expect(rm.createRoom('s1', 'Alice')).toMatch(/^[A-Z0-9]{4}$/);
  });

  test('joinRoom succeeds', () => {
    const rm = new RoomManager();
    const code = rm.createRoom('s1', 'Alice');
    const r = rm.joinRoom(code, 's2', 'Bob');
    expect(r.error).toBeUndefined();
    expect(r.room.players.length).toBe(2);
  });

  test('joinRoom fails — unknown code', () => {
    const rm = new RoomManager();
    expect(rm.joinRoom('XXXX', 's2', 'Bob').error).toBe('Room not found');
  });

  test('joinRoom fails — room full', () => {
    const rm = new RoomManager();
    const code = rm.createRoom('s1', 'A');
    rm.joinRoom(code, 's2', 'B');
    expect(rm.joinRoom(code, 's3', 'C').error).toBe('Room is full');
  });

  test('submitBoard starts game when both ready', () => {
    const rm = new RoomManager();
    const code = rm.createRoom('s1', 'A');
    rm.joinRoom(code, 's2', 'B');
    rm.submitBoard('s1', BOARD);
    const r = rm.submitBoard('s2', BOARD);
    expect(r.started).toBe(true);
    expect(['s1', 's2']).toContain(r.room.currentTurn);
  });

  test('processShot errors when not player turn', () => {
    const rm = new RoomManager();
    const code = rm.createRoom('s1', 'A');
    rm.joinRoom(code, 's2', 'B');
    rm.submitBoard('s1', BOARD);
    rm.submitBoard('s2', BOARD);
    const room = rm.getRoomBySocket('s1');
    const notTurn = room.currentTurn === 's1' ? 's2' : 's1';
    expect(rm.processShot(notTurn, 0).error).toBe('Not your turn');
  });

  test('removePlayer cleans up empty room', () => {
    const rm = new RoomManager();
    const code = rm.createRoom('s1', 'A');
    rm.removePlayer('s1');
    expect(rm.joinRoom(code, 's2', 'B').error).toBe('Room not found');
  });
});
