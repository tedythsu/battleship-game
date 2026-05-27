# Online Multiplayer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an online multiplayer mode where two players connect via a room code, manually place ships, and take turns attacking with a 30-second timer.

**Architecture:** Node.js + Socket.io server (Render) owns all authoritative game state. Angular 17 frontend (Vercel) communicates via WebSockets through a singleton SocketService. Three new standalone Angular components added alongside existing modes.

**Tech Stack:** Node.js 18+, Express 4.x, Socket.io 4.x, Jest (backend), Angular 17 standalone components, socket.io-client 4.x

---

## File Map

**New — Backend (`server/`):**
- `server/package.json` — dependencies and scripts
- `server/index.js` — Express + Socket.io, all event wiring
- `server/gameEngine.js` — shot processing, win detection
- `server/roomManager.js` — room lifecycle, turn management
- `server/timerManager.js` — per-room 30s turn timers
- `server/__tests__/gameEngine.test.js`
- `server/__tests__/roomManager.test.js`
- `server/__tests__/timerManager.test.js`
- `server/render.yaml` — Render deployment config

**New — Frontend:**
- `src/environments/environment.ts`
- `src/environments/environment.prod.ts`
- `src/app/core/services/socket.service.ts`
- `src/app/pages/online-lobby/online-lobby.component.{ts,html,scss}`
- `src/app/pages/online-placement/online-placement.component.{ts,html,scss}`
- `src/app/pages/online-game/online-game.component.{ts,html,scss}`

**Modified — Frontend:**
- `src/app/app-routing.module.ts` — add `/online`, `/online/place`, `/online/game`
- `src/app/pages/home-page/home-page.component.html` — add ONLINE BATTLE button
- `src/app/pages/home-page/home-page.component.ts` — add `navigateToOnline()`
- `angular.json` — add environment file replacement

---

## Task 1: Backend project setup

**Files:**
- Create: `server/package.json`
- Create: `server/index.js`

- [ ] **Step 1: Create `server/package.json`**

```json
{
  "name": "battleship-server",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js",
    "test": "jest"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "express": "^4.18.2",
    "socket.io": "^4.7.2"
  },
  "devDependencies": {
    "jest": "^29.7.0",
    "nodemon": "^3.0.2"
  }
}
```

- [ ] **Step 2: Create `server/index.js` skeleton**

```javascript
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

io.on('connection', (socket) => {
  console.log('connected:', socket.id);
  socket.on('disconnect', () => console.log('disconnected:', socket.id));
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => console.log(`Server on port ${PORT}`));
```

- [ ] **Step 3: Install dependencies**

```bash
cd server && npm install
```

Expected: `node_modules/` created, no errors.

- [ ] **Step 4: Verify server starts**

```bash
cd server && node index.js
```

Expected: `Server on port 3001`. Stop with Ctrl+C.

- [ ] **Step 5: Commit**

```bash
git add server/
git commit -m "feat: add backend project skeleton"
```

---

## Task 2: GameEngine

**Files:**
- Create: `server/gameEngine.js`
- Create: `server/__tests__/gameEngine.test.js`

- [ ] **Step 1: Write failing tests — create `server/__tests__/gameEngine.test.js`**

```javascript
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
```

- [ ] **Step 2: Run — verify FAIL**

```bash
cd server && npx jest __tests__/gameEngine.test.js
```

Expected: FAIL — `Cannot find module '../gameEngine'`

- [ ] **Step 3: Create `server/gameEngine.js`**

```javascript
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
```

- [ ] **Step 4: Run — verify PASS**

```bash
cd server && npx jest __tests__/gameEngine.test.js
```

Expected: PASS — 6 tests

- [ ] **Step 5: Commit**

```bash
git add server/gameEngine.js server/__tests__/gameEngine.test.js
git commit -m "feat: add GameEngine with shot processing"
```

---

## Task 3: RoomManager

**Files:**
- Create: `server/roomManager.js`
- Create: `server/__tests__/roomManager.test.js`

- [ ] **Step 1: Write failing tests — create `server/__tests__/roomManager.test.js`**

```javascript
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
```

- [ ] **Step 2: Run — verify FAIL**

```bash
cd server && npx jest __tests__/roomManager.test.js
```

Expected: FAIL — `Cannot find module '../roomManager'`

- [ ] **Step 3: Create `server/roomManager.js`**

```javascript
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
```

- [ ] **Step 4: Run — verify PASS**

```bash
cd server && npx jest __tests__/roomManager.test.js
```

Expected: PASS — 7 tests

- [ ] **Step 5: Commit**

```bash
git add server/roomManager.js server/__tests__/roomManager.test.js
git commit -m "feat: add RoomManager with room lifecycle"
```

---

## Task 4: TimerManager

**Files:**
- Create: `server/timerManager.js`
- Create: `server/__tests__/timerManager.test.js`

- [ ] **Step 1: Write failing tests — create `server/__tests__/timerManager.test.js`**

```javascript
const { TimerManager } = require('../timerManager');

jest.useFakeTimers();

describe('TimerManager', () => {
  test('fires callback after duration', () => {
    const tm = new TimerManager();
    const cb = jest.fn();
    tm.start('r1', 1000, cb);
    jest.advanceTimersByTime(999);
    expect(cb).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1);
    expect(cb).toHaveBeenCalledTimes(1);
  });

  test('clear prevents callback', () => {
    const tm = new TimerManager();
    const cb = jest.fn();
    tm.start('r1', 1000, cb);
    tm.clear('r1');
    jest.advanceTimersByTime(2000);
    expect(cb).not.toHaveBeenCalled();
  });

  test('start replaces existing timer', () => {
    const tm = new TimerManager();
    const cb1 = jest.fn();
    const cb2 = jest.fn();
    tm.start('r1', 1000, cb1);
    tm.start('r1', 1000, cb2);
    jest.advanceTimersByTime(1000);
    expect(cb1).not.toHaveBeenCalled();
    expect(cb2).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run — verify FAIL**

```bash
cd server && npx jest __tests__/timerManager.test.js
```

- [ ] **Step 3: Create `server/timerManager.js`**

```javascript
class TimerManager {
  constructor() {
    this.timers = new Map();
  }

  start(roomCode, durationMs, onTimeout) {
    this.clear(roomCode);
    this.timers.set(roomCode, setTimeout(onTimeout, durationMs));
  }

  clear(roomCode) {
    if (this.timers.has(roomCode)) {
      clearTimeout(this.timers.get(roomCode));
      this.timers.delete(roomCode);
    }
  }
}

module.exports = { TimerManager };
```

- [ ] **Step 4: Run all backend tests — verify PASS**

```bash
cd server && npx jest
```

Expected: PASS — 16 tests

- [ ] **Step 5: Commit**

```bash
git add server/timerManager.js server/__tests__/timerManager.test.js
git commit -m "feat: add TimerManager for turn countdown"
```

---

## Task 5: Wire Socket.io events

**Files:**
- Modify: `server/index.js`

- [ ] **Step 1: Replace `server/index.js` with full event wiring**

```javascript
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { RoomManager } = require('./roomManager');
const { TimerManager } = require('./timerManager');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
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
      io.to(result.room.code).emit('game_over', { winner: socket.id, reason: 'all_ships_sunk' });
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
```

- [ ] **Step 2: Verify server starts**

```bash
cd server && node index.js
```

Expected: `Server on port 3001`. Stop with Ctrl+C.

- [ ] **Step 3: Commit**

```bash
git add server/index.js
git commit -m "feat: wire all socket.io game events"
```

---

## Task 6: Frontend — SocketService + Environment

**Files:**
- Create: `src/environments/environment.ts`
- Create: `src/environments/environment.prod.ts`
- Modify: `angular.json`
- Create: `src/app/core/services/socket.service.ts`

- [ ] **Step 1: Install socket.io-client (run from project root, not server/)**

```bash
npm install socket.io-client
```

- [ ] **Step 2: Create `src/environments/environment.ts`**

```typescript
export const environment = {
  production: false,
  socketServerUrl: 'http://localhost:3001',
};
```

- [ ] **Step 3: Create `src/environments/environment.prod.ts`**

```typescript
export const environment = {
  production: true,
  socketServerUrl: 'https://YOUR-APP.onrender.com',
};
```

(Replace the URL in Task 12 after Render deployment.)

- [ ] **Step 4: Add fileReplacements in `angular.json`**

In `angular.json`, find the `"production"` configuration block under `"architect" > "build" > "configurations"` and add `"fileReplacements"` at the top:

```json
"production": {
  "fileReplacements": [
    {
      "replace": "src/environments/environment.ts",
      "with": "src/environments/environment.prod.ts"
    }
  ],
  "budgets": [
    { "type": "initial", "maximumWarning": "500kb", "maximumError": "1mb" },
    { "type": "anyComponentStyle", "maximumWarning": "2kb", "maximumError": "4kb" }
  ],
  "outputHashing": "all"
}
```

- [ ] **Step 5: Create `src/app/core/services/socket.service.ts`**

```typescript
import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from 'src/environments/environment';

export interface BoardCell {
  location: string;
  hasBeenShot: boolean;
  ship?: string;
}

export interface OnlineGameState {
  roomCode: string;
  myNickname: string;
  opponentNickname: string;
  myBoard: BoardCell[];
}

@Injectable({ providedIn: 'root' })
export class SocketService {
  private socket: Socket | null = null;
  gameState: Partial<OnlineGameState> = {};

  connect(): void {
    if (this.socket?.connected) return;
    this.socket = io(environment.socketServerUrl);
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
    this.gameState = {};
  }

  emit(event: string, data?: unknown): void {
    this.socket?.emit(event, data);
  }

  on<T>(event: string, callback: (data: T) => void): void {
    this.socket?.on(event, callback);
  }

  off(event: string): void {
    this.socket?.off(event);
  }

  get socketId(): string {
    return this.socket?.id ?? '';
  }
}
```

- [ ] **Step 6: Commit**

```bash
git add src/environments/ src/app/core/services/socket.service.ts angular.json package.json package-lock.json
git commit -m "feat: add SocketService and environment config"
```

---

## Task 7: Home Page Update

**Files:**
- Modify: `src/app/pages/home-page/home-page.component.html`
- Modify: `src/app/pages/home-page/home-page.component.ts`

- [ ] **Step 1: Update `home-page.component.html`**

```html
<main class="main-container">
  <header>
    <h2>SELECT A GAME MODE</h2>
  </header>
  <section>
    <ul class="game-mode-list">
      <li class="game-mode-list__item">
        <button class="common-btn" (click)="navigateToGame('Single Player')">SOLO</button>
      </li>
      <li class="game-mode-list__item">
        <button class="common-btn" (click)="navigateToGame('Multi Player')">2-PLAYER MODE</button>
      </li>
      <li class="game-mode-list__item">
        <button class="common-btn" (click)="navigateToOnline()">ONLINE BATTLE</button>
      </li>
    </ul>
  </section>
</main>
```

- [ ] **Step 2: Update `home-page.component.ts`**

```typescript
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AlertService } from 'src/app/core/services/alert.service';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss',
})
export class HomePageComponent {
  constructor(private router: Router, private alertService: AlertService) {}

  get isOnMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  navigateToGame(gameMode: string) {
    if (gameMode === 'Multi Player' && this.isOnMobileDevice) {
      this.alertService.showModal('2 players mode is not available on mobile device!');
    } else {
      this.router.navigate(['game'], { state: { gameMode } });
    }
  }

  navigateToOnline() {
    this.router.navigate(['online']);
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/pages/home-page/
git commit -m "feat: add ONLINE BATTLE button to home page"
```

---

## Task 8: OnlineLobbyComponent

**Files:**
- Create: `src/app/pages/online-lobby/online-lobby.component.ts`
- Create: `src/app/pages/online-lobby/online-lobby.component.html`
- Create: `src/app/pages/online-lobby/online-lobby.component.scss`

- [ ] **Step 1: Create `online-lobby.component.ts`**

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SocketService } from 'src/app/core/services/socket.service';

@Component({
  selector: 'app-online-lobby',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './online-lobby.component.html',
  styleUrl: './online-lobby.component.scss',
})
export class OnlineLobbyComponent implements OnInit, OnDestroy {
  nickname = '';
  joinCode = '';
  roomCode = '';
  errorMessage = '';
  isWaiting = false;

  constructor(public socketService: SocketService, private router: Router) {}

  ngOnInit(): void {
    this.socketService.connect();

    this.socketService.on<{ roomCode: string }>('room_created', ({ roomCode }) => {
      this.roomCode = roomCode;
      this.isWaiting = true;
      this.socketService.gameState.roomCode = roomCode;
    });

    this.socketService.on<{ opponentNickname: string }>('room_joined', ({ opponentNickname }) => {
      this.socketService.gameState.opponentNickname = opponentNickname;
    });

    this.socketService.on('placement_phase', () => {
      this.router.navigate(['online', 'place']);
    });

    this.socketService.on<{ message: string }>('room_error', ({ message }) => {
      this.errorMessage = message;
    });
  }

  ngOnDestroy(): void {
    ['room_created', 'room_joined', 'placement_phase', 'room_error'].forEach(e => this.socketService.off(e));
  }

  createRoom(): void {
    if (!this.nickname.trim()) return;
    this.socketService.gameState.myNickname = this.nickname.trim().toUpperCase();
    this.errorMessage = '';
    this.socketService.emit('create_room', { nickname: this.socketService.gameState.myNickname });
  }

  joinRoom(): void {
    if (!this.nickname.trim() || !this.joinCode.trim()) return;
    this.socketService.gameState.myNickname = this.nickname.trim().toUpperCase();
    this.errorMessage = '';
    this.socketService.emit('join_room', {
      roomCode: this.joinCode.trim().toUpperCase(),
      nickname: this.socketService.gameState.myNickname,
    });
  }

  cancel(): void {
    this.socketService.disconnect();
    this.isWaiting = false;
    this.roomCode = '';
    this.errorMessage = '';
  }
}
```

- [ ] **Step 2: Create `online-lobby.component.html`**

```html
<main class="lobby-container">
  <header><h2>ONLINE BATTLE</h2></header>

  @if (!isWaiting) {
    <div class="lobby-form">
      <label class="field-label">NICKNAME</label>
      <input class="field-input" [(ngModel)]="nickname" placeholder="Enter nickname" maxlength="12" />

      @if (errorMessage) {
        <p class="error-msg">{{ errorMessage }}</p>
      }

      <button class="common-btn" [disabled]="!nickname.trim()" (click)="createRoom()">
        CREATE ROOM
      </button>

      <div class="divider">OR JOIN</div>

      <div class="join-row">
        <input class="field-input field-input--code" [(ngModel)]="joinCode"
          placeholder="Room code" maxlength="4" />
        <button class="common-btn" [disabled]="!nickname.trim() || !joinCode.trim()" (click)="joinRoom()">
          JOIN
        </button>
      </div>
    </div>

    <button class="back-btn" routerLink="/">← BACK</button>
  }

  @if (isWaiting) {
    <div class="waiting-box">
      <p class="field-label">SHARE THIS CODE</p>
      <div class="room-code">{{ roomCode }}</div>
      <p class="waiting-text">Waiting for opponent...</p>
      <div class="dots"><span></span><span></span><span></span></div>
    </div>
    <button class="back-btn" (click)="cancel()">CANCEL</button>
  }
</main>
```

- [ ] **Step 3: Create `online-lobby.component.scss`**

```scss
.lobby-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 70vh;
  gap: 24px;
}

.lobby-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 300px;
}

.field-label {
  font-size: 10px;
  letter-spacing: 2px;
  color: #888;
  text-transform: uppercase;
}

.field-input {
  background: transparent;
  border: 1px solid #4f8ef7;
  border-radius: 4px;
  padding: 10px 14px;
  color: #fff;
  font-family: inherit;
  font-size: 14px;
  width: 100%;
  box-sizing: border-box;

  &--code { text-transform: uppercase; letter-spacing: 4px; flex: 1; }
}

.divider { text-align: center; color: #555; font-size: 11px; letter-spacing: 2px; }

.join-row { display: flex; gap: 8px; }

.error-msg { color: #e74c3c; font-size: 12px; text-align: center; }

.waiting-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 32px;
  border: 1px solid #2a2d3a;
  border-radius: 12px;
}

.room-code {
  font-size: 48px;
  font-weight: bold;
  letter-spacing: 12px;
  color: #4caf50;
  border: 2px solid #4caf50;
  border-radius: 8px;
  padding: 12px 24px;
}

.waiting-text { color: #f7a84f; font-size: 12px; letter-spacing: 2px; }

.dots {
  display: flex;
  gap: 6px;
  span {
    width: 8px; height: 8px; border-radius: 50%; background: #f7a84f;
    animation: pulse 1.2s infinite;
    &:nth-child(2) { animation-delay: 0.4s; }
    &:nth-child(3) { animation-delay: 0.8s; }
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.2; }
}

.back-btn {
  background: transparent;
  border: 1px solid #2a2d3a;
  color: #666;
  padding: 8px 20px;
  cursor: pointer;
  font-family: inherit;
  font-size: 11px;
  border-radius: 4px;
  &:hover { color: #aaa; }
}
```

- [ ] **Step 4: No commit yet — commit after all three components exist (Task 11)**

---

## Task 9: OnlinePlacementComponent

**Files:**
- Create: `src/app/pages/online-placement/online-placement.component.ts`
- Create: `src/app/pages/online-placement/online-placement.component.html`
- Create: `src/app/pages/online-placement/online-placement.component.scss`

- [ ] **Step 1: Create `online-placement.component.ts`**

```typescript
import { Component, OnInit, OnDestroy, WritableSignal, Signal, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SocketService, BoardCell } from 'src/app/core/services/socket.service';

interface Ship { name: string; size: number; placed: boolean; }

enum Dir { Right = 'Right', Down = 'Down', Left = 'Left', Up = 'Up' }

@Component({
  selector: 'app-online-placement',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './online-placement.component.html',
  styleUrl: './online-placement.component.scss',
})
export class OnlinePlacementComponent implements OnInit, OnDestroy {
  readonly N = 8;
  readonly letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  ships: Ship[] = [
    { name: 'Destroyer', size: 2, placed: false },
    { name: 'Cruiser', size: 3, placed: false },
    { name: 'Battleship', size: 4, placed: false },
  ];

  board: WritableSignal<BoardCell[]> = signal([]);
  selected: Ship | null = null;
  dir: Dir = Dir.Right;
  hovered: number[] = [];
  isWaiting = false;
  myNickname = '';

  allPlaced: Signal<boolean> = computed(() => this.board().length > 0 && this.ships.every(s => s.placed));

  constructor(private socketService: SocketService, private router: Router) {}

  ngOnInit(): void {
    this.myNickname = this.socketService.gameState.myNickname ?? '';
    this.initBoard();
    this.socketService.on('game_start', () => this.router.navigate(['online', 'game']));
  }

  ngOnDestroy(): void { this.socketService.off('game_start'); }

  private initBoard(): void {
    this.board.set(Array.from({ length: this.N * this.N }, (_, i) => ({
      location: this.letters[Math.floor(i / this.N)] + ((i % this.N) + 1),
      hasBeenShot: false,
    })));
    this.ships.forEach(s => s.placed = false);
    this.selected = null;
    this.hovered = [];
  }

  selectShip(ship: Ship): void {
    if (ship.placed) return;
    this.selected = this.selected === ship ? null : ship;
    this.hovered = [];
  }

  rotate(): void {
    const dirs = [Dir.Right, Dir.Down, Dir.Left, Dir.Up];
    this.dir = dirs[(dirs.indexOf(this.dir) + 1) % 4];
    this.hovered = [];
  }

  onHover(i: number): void {
    if (!this.selected) { this.hovered = []; return; }
    const idxs = this.indexes(i, this.dir, this.selected.size);
    this.hovered = this.valid(idxs) ? idxs : [];
  }

  onClick(i: number): void {
    if (!this.selected) return;
    const idxs = this.indexes(i, this.dir, this.selected.size);
    if (!this.valid(idxs)) return;
    const b = [...this.board()];
    idxs.forEach(idx => b[idx] = { ...b[idx], ship: this.selected!.name });
    this.board.set(b);
    this.selected.placed = true;
    this.selected = null;
    this.hovered = [];
  }

  private indexes(start: number, dir: Dir, size: number): number[] {
    return Array.from({ length: size }, (_, i) => {
      if (dir === Dir.Right) return start + i;
      if (dir === Dir.Left)  return start - i;
      if (dir === Dir.Down)  return start + this.N * i;
      return start - this.N * i;
    });
  }

  private valid(idxs: number[]): boolean {
    const total = this.N * this.N;
    if (idxs.some(i => i < 0 || i >= total)) return false;
    if ([Dir.Right, Dir.Left].includes(this.dir)) {
      const rows = idxs.map(i => Math.floor(i / this.N));
      if (rows.some(r => r !== rows[0])) return false;
    }
    return idxs.every(i => !this.board()[i].ship);
  }

  randomize(): void {
    const dirs = [Dir.Right, Dir.Down, Dir.Left, Dir.Up];
    const b: BoardCell[] = Array.from({ length: this.N * this.N }, (_, i) => ({
      location: this.letters[Math.floor(i / this.N)] + ((i % this.N) + 1),
      hasBeenShot: false,
    }));
    this.ships.forEach(ship => {
      ship.placed = false;
      let ok = false, tries = 0;
      while (!ok && tries++ < 200) {
        const start = Math.floor(Math.random() * b.length);
        const dir = dirs[Math.floor(Math.random() * 4)];
        const idxs = this.indexes(start, dir, ship.size);
        const total = this.N * this.N;
        const noOob = idxs.every(i => i >= 0 && i < total);
        const noOverlap = idxs.every(i => !b[i].ship);
        const noWrap = [Dir.Right, Dir.Left].includes(dir)
          ? idxs.map(i => Math.floor(i / this.N)).every((r, _, a) => r === a[0])
          : true;
        if (noOob && noOverlap && noWrap) {
          idxs.forEach(i => b[i] = { ...b[i], ship: ship.name });
          ship.placed = true;
          ok = true;
        }
      }
    });
    this.board.set(b);
    this.selected = null;
    this.hovered = [];
  }

  confirm(): void {
    if (!this.allPlaced()) return;
    this.isWaiting = true;
    this.socketService.gameState.myBoard = this.board();
    this.socketService.emit('submit_board', { cells: this.board() });
  }

  isHovered(i: number): boolean { return this.hovered.includes(i); }
}
```

- [ ] **Step 2: Create `online-placement.component.html`**

```html
<main class="placement-container">
  <header>
    <h2>ARRANGE YOUR FLEET</h2>
    @if (myNickname) { <span class="player-label">{{ myNickname }}</span> }
  </header>

  @if (isWaiting) {
    <div class="waiting-msg">Waiting for opponent to finish placing...</div>
  } @else {
    <div class="placement-area">

      <div class="board-wrapper">
        <div class="board-col-labels">
          <div></div>
          @for (c of [].constructor(N); track $index) { <div>{{ $index + 1 }}</div> }
        </div>
        @for (row of [].constructor(N); track $index; let ri = $index) {
          <div class="board-row">
            <div class="row-label">{{ letters[ri] }}</div>
            @for (col of [].constructor(N); track $index; let ci = $index) {
              @let idx = ri * N + ci;
              <div class="board__cell"
                [class.board__cell--ship]="!!board()[idx].ship"
                [class.board__cell--hover]="isHovered(idx)"
                (mouseenter)="onHover(idx)"
                (mouseleave)="hovered = []"
                (click)="onClick(idx)">
              </div>
            }
          </div>
        }
      </div>

      <div class="ship-panel">
        <p class="panel-label">SHIPS</p>
        @for (ship of ships; track ship.name) {
          <div class="ship-item"
            [class.ship-item--placed]="ship.placed"
            [class.ship-item--selected]="selected === ship"
            (click)="selectShip(ship)">
            <span class="ship-name">{{ ship.name }}</span>
            <span class="ship-meta">×{{ ship.size }}</span>
            @if (ship.placed) { <span class="check">✓</span> }
          </div>
        }
        <button class="ctrl-btn" [disabled]="!selected" (click)="rotate()">↻ {{ dir }}</button>
        <button class="ctrl-btn" (click)="randomize()">RANDOM</button>
        <button class="common-btn confirm-btn" [disabled]="!allPlaced()" (click)="confirm()">
          {{ allPlaced() ? 'CONFIRM' : ships.filter(s => !s.placed).length + ' LEFT' }}
        </button>
      </div>

    </div>
  }
</main>
```

- [ ] **Step 3: Create `online-placement.component.scss`**

```scss
.placement-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 24px;
}
.player-label { font-size: 12px; color: #4f8ef7; letter-spacing: 2px; margin-left: 12px; }
.waiting-msg { color: #f7a84f; font-size: 13px; letter-spacing: 2px; margin-top: 40px; }
.placement-area { display: flex; gap: 24px; align-items: flex-start; }
.board-wrapper { display: flex; flex-direction: column; gap: 2px; }
.board-col-labels {
  display: grid;
  grid-template-columns: 20px repeat(8, 44px);
  gap: 2px;
  div { text-align: center; font-size: 11px; color: #555; }
}
.board-row { display: flex; gap: 2px; align-items: center; }
.row-label { width: 20px; text-align: center; font-size: 11px; color: #555; }
.board__cell {
  width: 44px; height: 44px;
  background: #1a1f2e; border: 1px solid #2a2d3a; border-radius: 2px; cursor: crosshair;
  &--ship { background: #1a3a2e; border-color: #4caf50; }
  &--hover { background: #1a2e3a; border: 2px dashed #4f8ef7; }
}
.ship-panel { display: flex; flex-direction: column; gap: 8px; min-width: 160px; }
.panel-label { font-size: 10px; letter-spacing: 2px; color: #888; text-transform: uppercase; }
.ship-item {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 12px; border: 1px solid #2a2d3a; border-radius: 4px; cursor: pointer;
  &--placed { border-color: #4caf50; color: #4caf50; cursor: default; }
  &--selected { border-color: #4f8ef7; background: #1a2e3a; }
}
.ship-name { flex: 1; font-size: 12px; }
.ship-meta { font-size: 10px; color: #666; }
.check { color: #4caf50; }
.ctrl-btn {
  background: #1a1f2e; border: 1px solid #2a2d3a; color: #aaa;
  padding: 8px; border-radius: 4px; cursor: pointer; font-family: inherit;
  font-size: 11px; letter-spacing: 1px;
  &:disabled { opacity: 0.4; cursor: default; }
}
.confirm-btn { margin-top: 8px; &:disabled { opacity: 0.5; cursor: not-allowed; } }
```

---

## Task 10: OnlineGameComponent

**Files:**
- Create: `src/app/pages/online-game/online-game.component.ts`
- Create: `src/app/pages/online-game/online-game.component.html`
- Create: `src/app/pages/online-game/online-game.component.scss`

- [ ] **Step 1: Create `online-game.component.ts`**

```typescript
import { Component, OnInit, OnDestroy, WritableSignal, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SocketService, BoardCell } from 'src/app/core/services/socket.service';
import { AlertService } from 'src/app/core/services/alert.service';

@Component({
  selector: 'app-online-game',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './online-game.component.html',
  styleUrl: './online-game.component.scss',
})
export class OnlineGameComponent implements OnInit, OnDestroy {
  readonly N = 8;
  readonly letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  myBoard: WritableSignal<BoardCell[]> = signal([]);
  attackBoard: WritableSignal<BoardCell[]> = signal([]);
  isMyTurn: WritableSignal<boolean> = signal(false);
  timeLeft: WritableSignal<number> = signal(30);
  gameOver: WritableSignal<boolean> = signal(false);

  myNickname = '';
  opponentNickname = '';

  private timerInterval: ReturnType<typeof setInterval> | null = null;

  constructor(
    private socketService: SocketService,
    private router: Router,
    private alertService: AlertService,
  ) {}

  ngOnInit(): void {
    const gs = this.socketService.gameState;
    this.myNickname = gs.myNickname ?? 'YOU';
    this.opponentNickname = gs.opponentNickname ?? 'OPPONENT';
    this.myBoard.set(gs.myBoard ?? []);
    this.attackBoard.set(
      Array.from({ length: this.N * this.N }, () => ({ location: '', hasBeenShot: false }))
    );

    this.socketService.on<{ socketId: string; timeLimit: number }>('turn_start', ({ socketId, timeLimit }) => {
      this.isMyTurn.set(socketId === this.socketService.socketId);
      this.startTimer(timeLimit);
    });

    this.socketService.on<{
      shooterSocketId: string; cellIndex: number; hit: boolean;
      shipName: string | null; shipSunk: boolean; gameOver: boolean;
    }>('shot_result', (data) => {
      if (data.shooterSocketId === this.socketService.socketId) {
        const b = [...this.attackBoard()];
        b[data.cellIndex] = { ...b[data.cellIndex], hasBeenShot: true, ship: data.hit ? (data.shipName ?? 'hit') : undefined };
        this.attackBoard.set(b);
      } else {
        const b = [...this.myBoard()];
        b[data.cellIndex] = { ...b[data.cellIndex], hasBeenShot: true };
        this.myBoard.set(b);
      }
    });

    this.socketService.on<{ winner: string }>('game_over', ({ winner }) => {
      this.stopTimer();
      this.gameOver.set(true);
      this.alertService.showModal(winner === this.socketService.socketId ? 'YOU WIN!' : 'YOU LOSE!');
    });

    this.socketService.on('opponent_disconnected', () => {
      this.stopTimer();
      this.gameOver.set(true);
      this.alertService.showModal('OPPONENT DISCONNECTED — YOU WIN!');
    });
  }

  ngOnDestroy(): void {
    this.stopTimer();
    ['turn_start', 'shot_result', 'game_over', 'opponent_disconnected'].forEach(e => this.socketService.off(e));
  }

  fire(idx: number): void {
    if (!this.isMyTurn() || this.gameOver() || this.attackBoard()[idx].hasBeenShot) return;
    this.socketService.emit('fire', { cellIndex: idx });
    this.isMyTurn.set(false);
    this.stopTimer();
  }

  exitGame(): void {
    this.socketService.disconnect();
    this.router.navigate(['']);
  }

  private startTimer(seconds: number): void {
    this.stopTimer();
    this.timeLeft.set(seconds);
    this.timerInterval = setInterval(() => {
      this.timeLeft.update(t => (t <= 1 ? (this.stopTimer(), 0) : t - 1));
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timerInterval) { clearInterval(this.timerInterval); this.timerInterval = null; }
  }
}
```

- [ ] **Step 2: Create `online-game.component.html`**

```html
<main class="game-container">
  <div class="top-bar">
    <span class="ptag ptag--me">● {{ myNickname }}</span>
    <div class="timer" [class.timer--active]="isMyTurn()">
      <div class="timer__label">{{ isMyTurn() ? 'YOUR TURN' : 'WAITING' }}</div>
      <div class="timer__count">{{ timeLeft() }}</div>
      <div class="timer__unit">SEC</div>
    </div>
    <span class="ptag ptag--opp">○ {{ opponentNickname }}</span>
  </div>

  <div class="boards">
    <div class="board-section">
      <div class="board-label">MY BOARD</div>
      <div class="col-labels">
        <div></div>
        @for (n of [].constructor(N); track $index) { <div>{{ $index + 1 }}</div> }
      </div>
      @for (row of [].constructor(N); track $index; let ri = $index) {
        <div class="board-row">
          <div class="row-label">{{ letters[ri] }}</div>
          @for (col of [].constructor(N); track $index; let ci = $index) {
            @let idx = ri * N + ci;
            <div class="board__cell"
              [class.cell--ship]="!!myBoard()[idx].ship && !myBoard()[idx].hasBeenShot"
              [class.cell--hit]="myBoard()[idx].hasBeenShot && !!myBoard()[idx].ship"
              [class.cell--miss]="myBoard()[idx].hasBeenShot && !myBoard()[idx].ship">
            </div>
          }
        </div>
      }
    </div>

    <div class="board-section">
      <div class="board-label board-label--atk">ATTACK BOARD</div>
      <div class="col-labels">
        <div></div>
        @for (n of [].constructor(N); track $index) { <div>{{ $index + 1 }}</div> }
      </div>
      @for (row of [].constructor(N); track $index; let ri = $index) {
        <div class="board-row">
          <div class="row-label">{{ letters[ri] }}</div>
          @for (col of [].constructor(N); track $index; let ci = $index) {
            @let idx = ri * N + ci;
            <div class="board__cell board__cell--atk"
              [class.cell--hit]="attackBoard()[idx].hasBeenShot && !!attackBoard()[idx].ship"
              [class.cell--miss]="attackBoard()[idx].hasBeenShot && !attackBoard()[idx].ship"
              [class.cell--clickable]="isMyTurn() && !gameOver() && !attackBoard()[idx].hasBeenShot"
              (click)="fire(idx)">
            </div>
          }
        </div>
      }
    </div>
  </div>

  <button class="common-btn" (click)="exitGame()">EXIT</button>
</main>
```

- [ ] **Step 3: Create `online-game.component.scss`**

```scss
.game-container { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 16px; }
.top-bar { display: flex; align-items: center; justify-content: space-between; width: 100%; max-width: 720px; }
.ptag { font-size: 13px; letter-spacing: 1px; &--me { color: #4caf50; } &--opp { color: #888; } }
.timer {
  text-align: center; border: 2px solid #2a2d3a; border-radius: 8px; padding: 8px 20px; min-width: 90px;
  &--active { border-color: #e74c3c; background: #1a0a0a; }
  &__label { font-size: 9px; letter-spacing: 2px; color: #888; }
  &__count { font-size: 28px; font-weight: bold; color: #e74c3c; line-height: 1; }
  &__unit { font-size: 9px; color: #666; }
}
.boards { display: flex; gap: 28px; flex-wrap: wrap; justify-content: center; }
.board-section { display: flex; flex-direction: column; gap: 2px; }
.board-label { font-size: 10px; letter-spacing: 2px; color: #888; text-transform: uppercase; margin-bottom: 4px; &--atk { color: #f7a84f; } }
.col-labels { display: grid; grid-template-columns: 18px repeat(8, 36px); gap: 2px; div { text-align: center; font-size: 9px; color: #555; } }
.board-row { display: flex; gap: 2px; align-items: center; }
.row-label { width: 18px; text-align: center; font-size: 9px; color: #555; }
.board__cell {
  width: 36px; height: 36px;
  background: #1a1f2e; border: 1px solid #2a2d3a; border-radius: 2px;
  display: flex; align-items: center; justify-content: center; font-size: 14px;
  &--atk { cursor: default; }
  &--clickable { cursor: crosshair; &:hover { background: #1e2840; border-color: #4f8ef7; } }
}
.cell--ship { background: #1a3a2e; border-color: #4caf50; }
.cell--hit { background: #3a1a1a; border-color: #e74c3c; &::after { content: '💥'; } }
.cell--miss { &::after { content: '○'; color: #3a5a8a; font-size: 11px; } }
```

---

## Task 11: Wire routing and verify full build

**Files:**
- Modify: `src/app/app-routing.module.ts`

- [ ] **Step 1: Update routing to include all three online components**

```typescript
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomePageComponent } from './pages/home-page/home-page.component';
import { GamePageComponent } from './pages/game-page/game-page.component';
import { SettingsPageComponent } from './pages/settings-page/settings-page.component';
import { OnlineLobbyComponent } from './pages/online-lobby/online-lobby.component';
import { OnlinePlacementComponent } from './pages/online-placement/online-placement.component';
import { OnlineGameComponent } from './pages/online-game/online-game.component';

const routes: Routes = [
  { path: '', component: HomePageComponent, pathMatch: 'full' },
  { path: 'game', component: GamePageComponent },
  { path: 'settings', component: SettingsPageComponent },
  { path: 'online', component: OnlineLobbyComponent },
  { path: 'online/place', component: OnlinePlacementComponent },
  { path: 'online/game', component: OnlineGameComponent },
  { path: '**', redirectTo: '' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
```

- [ ] **Step 2: Build — verify no TypeScript errors**

```bash
ng build
```

Expected: build succeeds. Fix any type errors before continuing.

- [ ] **Step 3: Local end-to-end test**

Start the backend in one terminal:
```bash
cd server && node index.js
```

Start the frontend in another:
```bash
ng serve
```

Open `http://localhost:4200` in two different browser tabs.

**Tab 1:** ONLINE BATTLE → enter nickname → CREATE ROOM → note code.
**Tab 2:** ONLINE BATTLE → enter same nickname (different name) → paste code → JOIN.

Both tabs advance to placement. Place all ships in both → CONFIRM in both. Verify:
- Timer counts down in the active player's tab
- Clicking an unshot attack cell fires a shot and updates both boards (hit = 💥, miss = ○)
- When all ships of one player are sunk, game over modal appears

- [ ] **Step 4: Commit all frontend work**

```bash
git add src/app/app-routing.module.ts \
        src/app/pages/home-page/ \
        src/app/pages/online-lobby/ \
        src/app/pages/online-placement/ \
        src/app/pages/online-game/
git commit -m "feat: add online multiplayer frontend (lobby, placement, game)"
```

- [ ] **Step 5: Push to GitHub**

```bash
git push
```

Vercel will automatically redeploy. Verify the ONLINE BATTLE button appears on the live Vercel URL.

---

## Task 12: Deploy backend to Render

**Files:**
- Create: `server/render.yaml`
- Modify: `src/environments/environment.prod.ts`

- [ ] **Step 1: Create `server/render.yaml`**

```yaml
services:
  - type: web
    name: battleship-server
    env: node
    rootDir: server
    buildCommand: npm install
    startCommand: node index.js
```

- [ ] **Step 2: Commit**

```bash
git add server/render.yaml
git commit -m "feat: add Render deployment config"
git push
```

- [ ] **Step 3: Deploy on Render**

1. Go to [render.com](https://render.com) → sign in with GitHub
2. **New → Web Service** → connect `battleship-game` repo
3. Set **Root Directory** to `server`
4. **Build Command:** `npm install`
5. **Start Command:** `node index.js`
6. Click **Deploy** — wait until status shows "Live"
7. Copy the URL (e.g. `https://battleship-server-abc123.onrender.com`)

- [ ] **Step 4: Update `src/environments/environment.prod.ts` with the real URL**

```typescript
export const environment = {
  production: true,
  socketServerUrl: 'https://battleship-server-abc123.onrender.com',
};
```

- [ ] **Step 5: Commit and push**

```bash
git add src/environments/environment.prod.ts
git commit -m "feat: set production socket server URL"
git push
```

- [ ] **Step 6: Final production test**

Open the Vercel URL in two different browsers (or incognito windows). Repeat the end-to-end test from Task 11 Step 3 against the live production URLs.

Expected: full game flow works — lobby → placement → battle → game over.
