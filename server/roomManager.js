const { GameEngine } = require('./gameEngine');

class RoomManager {
  constructor() {
    this.rooms = new Map();
  }

  generateCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    return Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  }

  createRoom(socketId, nickname) {
    let code;
    do { code = this.generateCode(); } while (this.rooms.has(code));
    this.rooms.set(code, {
      code,
      players: [{ socketId, nickname, board: null, ready: false }],
      gameEngine: null,
      currentTurn: null,
      status: 'waiting',
    });
    return code;
  }

  joinRoom(code, socketId, nickname) {
    const room = this.rooms.get(code);
    if (!room) return { error: 'Room not found' };
    if (room.players.length >= 2) return { error: 'Room is full' };
    if (room.status !== 'waiting') return { error: 'Game already started' };
    room.players.push({ socketId, nickname, board: null, ready: false });
    room.status = 'placing';
    return { room };
  }

  getRoomBySocket(socketId) {
    for (const room of this.rooms.values()) {
      if (room.players.find(p => p.socketId === socketId)) return room;
    }
    return null;
  }

  submitBoard(socketId, cells) {
    const room = this.getRoomBySocket(socketId);
    if (!room) return null;
    const player = room.players.find(p => p.socketId === socketId);
    player.board = cells;
    player.ready = true;
    if (room.players.every(p => p.ready)) {
      room.gameEngine = new GameEngine(room.players[0].board, room.players[1].board);
      room.currentTurn = room.players[Math.floor(Math.random() * 2)].socketId;
      room.status = 'playing';
      return { started: true, room };
    }
    return { started: false, room };
  }

  processShot(socketId, cellIndex) {
    const room = this.getRoomBySocket(socketId);
    if (!room || room.status !== 'playing') return { error: 'Game not active' };
    if (room.currentTurn !== socketId) return { error: 'Not your turn' };
    const attackerIndex = room.players.findIndex(p => p.socketId === socketId);
    const defenderIndex = 1 - attackerIndex;
    const result = room.gameEngine.processShot(defenderIndex, cellIndex);
    if (result.error) return result;
    if (!result.gameOver) {
      room.currentTurn = room.players[defenderIndex].socketId;
    } else {
      room.status = 'finished';
    }
    return { ...result, room };
  }

  removePlayer(socketId) {
    const room = this.getRoomBySocket(socketId);
    if (!room) return null;
    room.players = room.players.filter(p => p.socketId !== socketId);
    if (room.players.length === 0) this.rooms.delete(room.code);
    return room;
  }
}

module.exports = { RoomManager };
