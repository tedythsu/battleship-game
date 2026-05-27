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
