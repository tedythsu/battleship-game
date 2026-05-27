import { Component, OnInit, OnDestroy, WritableSignal, signal } from '@angular/core';
import { Router } from '@angular/router';
import { SocketService, BoardCell } from 'src/app/core/services/socket.service';
import { AlertService } from 'src/app/core/services/alert.service';

@Component({
  selector: 'app-online-game',
  standalone: true,
  imports: [],
  templateUrl: './online-game.component.html',
  styleUrl: './online-game.component.scss',
})
export class OnlineGameComponent implements OnInit, OnDestroy {
  readonly N = 8;
  readonly letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  readonly rows = Array.from({ length: 8 }, (_, i) => i);
  readonly cols = Array.from({ length: 8 }, (_, i) => i);

  myBoard: WritableSignal<BoardCell[]> = signal([]);
  attackBoard: WritableSignal<BoardCell[]> = signal([]);
  isMyTurn: WritableSignal<boolean> = signal(false);
  timeLeft: WritableSignal<number> = signal(30);
  gameOver: WritableSignal<boolean> = signal(false);
  // Controls which board is shown on mobile: true = ATTACK BOARD, false = MY BOARD
  showAttack: WritableSignal<boolean> = signal(false);

  myNickname = '';
  opponentNickname = '';

  private timerInterval: ReturnType<typeof setInterval> | null = null;
  private resultTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private socketService: SocketService,
    private router: Router,
    private alertService: AlertService,
  ) {}

  ngOnInit(): void {
    ['turn_start', 'shot_result', 'game_over', 'opponent_disconnected']
      .forEach(e => this.socketService.off(e));

    const gs = this.socketService.gameState;
    this.myNickname = gs.myNickname ?? 'YOU';
    this.opponentNickname = gs.opponentNickname ?? 'OPPONENT';
    this.myBoard.set(gs.myBoard ?? Array.from({ length: this.N * this.N }, (_, i) => ({
      location: `${this.letters[Math.floor(i / this.N)]}${(i % this.N) + 1}`,
      hasBeenShot: false,
    })));
    this.attackBoard.set(
      Array.from({ length: this.N * this.N }, (_, i) => ({
        location: `${this.letters[Math.floor(i / this.N)]}${(i % this.N) + 1}`,
        hasBeenShot: false,
      }))
    );

    this.socketService.on<{ socketId: string; timeLimit: number }>('turn_start', ({ socketId, timeLimit }) => {
      if (this.gameOver()) return;
      const mine = socketId === this.socketService.socketId;
      this.isMyTurn.set(mine);
      if (mine) {
        // My turn starts — clear any pending result delay and show attack board
        this.clearResultTimeout();
        this.showAttack.set(true);
      }
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
        // Keep ATTACK BOARD visible for 2s so user sees the hit/miss result
        this.clearResultTimeout();
        this.resultTimeout = setTimeout(() => {
          if (!this.isMyTurn()) this.showAttack.set(false);
          this.resultTimeout = null;
        }, 2000);
      } else {
        const b = [...this.myBoard()];
        b[data.cellIndex] = { ...b[data.cellIndex], hasBeenShot: true };
        this.myBoard.set(b);
      }
    });

    this.socketService.on<{ winner: string }>('game_over', ({ winner }) => {
      this.stopTimer();
      this.clearResultTimeout();
      this.gameOver.set(true);
      this.alertService.showModal(winner === this.socketService.socketId ? 'YOU WIN!' : 'YOU LOSE!');
    });

    this.socketService.on('opponent_disconnected', () => {
      this.stopTimer();
      this.clearResultTimeout();
      this.gameOver.set(true);
      this.alertService.showModal('OPPONENT DISCONNECTED — YOU WIN!');
    });
  }

  ngOnDestroy(): void {
    this.stopTimer();
    this.clearResultTimeout();
    ['turn_start', 'shot_result', 'game_over', 'opponent_disconnected'].forEach(e => this.socketService.off(e));
  }

  fire(idx: number): void {
    if (!this.isMyTurn() || this.gameOver() || this.attackBoard()[idx].hasBeenShot) return;
    this.socketService.emit('fire', { cellIndex: idx });
    this.isMyTurn.set(false);
    this.stopTimer();
    // Keep attack board shown — shot_result handler will start the 2s delay
  }

  exitGame(): void {
    this.socketService.disconnect();
    this.router.navigate(['']);
  }

  private startTimer(seconds: number): void {
    this.stopTimer();
    this.timeLeft.set(seconds);
    this.timerInterval = setInterval(() => {
      const next = this.timeLeft() - 1;
      if (next <= 0) {
        this.timeLeft.set(0);
        this.stopTimer();
      } else {
        this.timeLeft.set(next);
      }
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timerInterval) { clearInterval(this.timerInterval); this.timerInterval = null; }
  }

  private clearResultTimeout(): void {
    if (this.resultTimeout) { clearTimeout(this.resultTimeout); this.resultTimeout = null; }
  }
}
