# Online Multiplayer Design

## Overview

Add an online multiplayer mode to the existing Angular 17 battleship game. Two players on separate devices connect via a room code, manually place their ships, then take turns attacking each other's board with a 30-second turn timer. Existing Single Player and Local Multi Player modes are preserved unchanged.

## Architecture

**Frontend:** Angular 17 SPA, deployed on Vercel (existing).

**Backend:** Node.js + Socket.io server, deployed on Render (new). The server owns all authoritative game state — ship positions, turn order, timer, and win conditions. The frontend sends actions and renders state; it never decides game outcomes.

```
Player 1 (Browser) <-- WebSocket --> Game Server (Node.js/Socket.io on Render)
Player 2 (Browser) <-- WebSocket --> Game Server
```

## Game Flow

### 1. Lobby

- Player enters a nickname (required, shown to opponent during game)
- **Create room:** server generates a 4-character alphanumeric room code (e.g. `AB3K`), player waits for opponent to join; room code is displayed prominently for sharing
- **Join room:** player enters a room code; if valid and not full, joins the room
- Once both players are in the room, both are automatically advanced to the ship placement phase

### 2. Ship Placement

- Each player places 3 ships on their own 8×8 grid privately:
  - Destroyer (size 2)
  - Cruiser (size 3)
  - Battleship (size 4)
- **UI interaction:** click a ship from the panel to select it → click a cell to place it → rotate button toggles horizontal/vertical orientation → preview highlights cells before placement
- **Random reset:** button to randomly re-place all ships (reuses existing random placement logic)
- Confirm button is disabled until all 3 ships are placed
- After confirming, player sees "Waiting for opponent..." until both have confirmed
- Server starts the game once both players submit their board

### 3. Battle

**Each player's view has two boards side by side:**

- **My Board (left):** shows own ship positions + cells the opponent has shot (💥 hit, · miss)
- **Attack Board (right):** shows shots fired at opponent — 🔥 hit, ○ miss; ships hidden; clickable only on player's turn

**Turn logic (server-authoritative):**

- Server randomly picks who goes first
- Active player has 30 seconds to click a cell on the Attack Board
- On timeout, turn passes to opponent automatically (no shot fired)
- On shot: server validates the cell (not already shot, valid index), updates state, broadcasts result to both players
- If a ship is fully sunk, server notifies both players which ship was sunk

**Top bar shows:**

- Both player nicknames with online indicator
- Countdown timer (red when it's your turn, gray when waiting)

### 4. Game End

- **Win condition:** all 3 opponent ships sunk
- **Draw:** not possible (no missile limit in online mode)
- **Disconnect:** if a player disconnects mid-game, the remaining player wins immediately and sees "Opponent disconnected"
- End screen shows winner/loser, reveals opponent's full board, offers "Play Again" (new placement phase, same room) or "Back to Lobby"

## Socket.io Events

### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `create_room` | `{ nickname }` | Create a new room |
| `join_room` | `{ roomCode, nickname }` | Join existing room |
| `submit_board` | `{ ships: BoardCell[] }` | Submit ship placement |
| `fire` | `{ cellIndex }` | Fire at opponent's board |

### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `room_created` | `{ roomCode }` | Room created, waiting for opponent |
| `room_joined` | `{ opponentNickname }` | Both players in room |
| `room_error` | `{ message }` | Room not found / full |
| `placement_phase` | — | Both players advance to placement |
| `game_start` | `{ firstTurn: socketId }` | Both boards submitted, game begins |
| `turn_start` | `{ socketId, timeLimit: 30 }` | Whose turn it is |
| `shot_result` | `{ cellIndex, hit, shipSunk?, shipName? }` | Result of a shot |
| `game_over` | `{ winner: socketId, reason }` | Game ended |
| `opponent_disconnected` | — | Opponent left mid-game |

## Frontend Changes

### New routes / pages

| Route | Component | Description |
|-------|-----------|-------------|
| `/online` | `OnlineLobbyComponent` | Nickname input + create/join room |
| `/online/place` | `OnlinePlacementComponent` | Manual ship placement |
| `/online/game` | `OnlineGameComponent` | Battle view |

### Existing code reuse

- Board generation and cell coordinate logic from `GamePageComponent` extracted to a shared utility
- Ship validation (`isShipPlacementValid`, `hasShipDiscontinuity`, etc.) reused in placement component
- Existing UI style (dark theme, Beon font, `.common-btn`) applied throughout new screens

### Home page

Add a third button: **ONLINE BATTLE** alongside the existing Single Player and Multi Player buttons, navigating to `/online`.

## Server Structure

```
server/
  index.js          # Express + Socket.io setup
  roomManager.js    # Room creation, join, cleanup
  gameEngine.js     # Board validation, shot resolution, win check
  timerManager.js   # Per-room 30-second turn timers
```

Deployed to Render free tier. No database — all state is in-memory (rooms are ephemeral).

## Deployment

| Layer | Platform | Notes |
|-------|----------|-------|
| Frontend | Vercel | Already deployed; add `/online` routes |
| Backend | Render | Free tier, Node.js web service |

Frontend connects to backend via environment variable `SOCKET_SERVER_URL` set in Vercel project settings.

## Out of Scope

- AI opponent (future)
- Persistent match history
- Spectator mode
- Mobile touch drag-and-drop for ship placement (click-to-place only)
