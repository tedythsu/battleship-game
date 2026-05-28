const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { RoomManager } = require('./roomManager');
const { TimerManager } = require('./timerManager');

const app = express();
app.use(require('cors')());
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_ORIGIN || '*',
    methods: ['GET', 'POST'],
  },
});

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

const roomManager = new RoomManager();
const timerManager = new TimerManager();
const TURN_MS = 30000;

function startTurn(room) {
  io.to(room.code).emit('turn_start', { socketId: room.currentTurn, timeLimit: 30 });
  timerManager.start(room.code, TURN_MS, () => {
    const r = roomManager.getRoomBySocket(room.currentTurn);
    if (!r || r.status !== 'playing') return;
    const other = r.players.find(p => p.socketId !== r.currentTurn);
    r.currentTurn = other.socketId;
    startTurn(r);
  });
}

io.on('connection', (socket) => {
  socket.on('create_room', ({ nickname }) => {
    const code = roomManager.createRoom(socket.id, nickname);
    socket.join(code);
    socket.emit('room_created', { roomCode: code });
  });

  socket.on('join_room', ({ roomCode, nickname }) => {
    const result = roomManager.joinRoom(roomCode, socket.id, nickname);
    if (result.error) { socket.emit('room_error', { message: result.error }); return; }
    socket.join(roomCode);
    const joiner = result.room.players.find(p => p.socketId === socket.id);
    const host = result.room.players.find(p => p.socketId !== socket.id);
    socket.emit('room_joined', { opponentNickname: host.nickname });
    socket.to(roomCode).emit('room_joined', { opponentNickname: joiner.nickname });
    io.to(roomCode).emit('placement_phase');
  });

  socket.on('submit_board', ({ cells }) => {
    const result = roomManager.submitBoard(socket.id, cells);
    if (!result) return;
    if (result.started) {
      io.to(result.room.code).emit('game_start', { firstTurn: result.room.currentTurn });
      startTurn(result.room);
    }
  });

  socket.on('fire', ({ cellIndex }) => {
    const result = roomManager.processShot(socket.id, cellIndex);
    if (!result || result.error) { socket.emit('fire_error', { message: result?.error }); return; }
    timerManager.clear(result.room.code);
    io.to(result.room.code).emit('shot_result', {
      shooterSocketId: socket.id,
      cellIndex: result.cellIndex,
      hit: result.hit,
      shipName: result.shipName,
      shipSunk: result.shipSunk,
      gameOver: result.gameOver,
    });
    if (result.gameOver) {
      result.room.players.forEach(player => {
        const opponent = result.room.players.find(p => p.socketId !== player.socketId);
        io.to(player.socketId).emit('game_over', {
          winner: socket.id,
          opponentBoard: opponent.board,
        });
      });
    } else {
      startTurn(result.room);
    }
  });

  socket.on('disconnect', () => {
    const room = roomManager.getRoomBySocket(socket.id);
    if (room && room.status === 'playing') {
      timerManager.clear(room.code);
      socket.to(room.code).emit('opponent_disconnected');
    }
    roomManager.removePlayer(socket.id);
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => console.log(`Server on port ${PORT}`));
