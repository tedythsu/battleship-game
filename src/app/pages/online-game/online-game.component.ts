import { Component, OnInit, OnDestroy, WritableSignal, signal } from '@angular/core';
import { Router } from '@angular/router';
import { SocketService, BoardCell } from 'src/app/core/services/socket.service';
import { AlertService } from 'src/app/core/services/alert.service';

type AnnouncementType = 'hit' | 'miss' | 'sunk';
interface Announcement { text: string; type: AnnouncementType; }

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
  showAttack: WritableSignal<boolean> = signal(false);
  isMobile: WritableSignal<boolean> = signal(false);
  announcement: WritableSignal<Announcement | null> = signal(null);
  shakeMyBoard: WritableSignal<number | null> = signal(null);
  shakeAttackBoard: WritableSignal<number | null> = signal(null);
  myShipsLeft: WritableSignal<number> = signal(0);
  opponentShipsLeft: WritableSignal<number> = signal(0);

  myNickname = '';
  opponentNickname = '';

  private timerInterval: ReturnType<typeof setInterval> | null = null;
  private resultTimeout: ReturnType<typeof setTimeout> | null = null;
  private announcementTimeout: ReturnType<typeof setTimeout> | null = null;
  private defenderNeedsDelay = false;
  private mql: MediaQueryList | null = null;
  private readonly mqlListener = (e: MediaQueryListEvent) => this.isMobile.set(e.matches);

  constructor(
    private socketService: SocketService,
    private router: Router,
    private alertService: AlertService,
  ) {}

  ngOnInit(): void {
    this.mql = window.matchMedia('(max-width: 680px)');
    this.isMobile.set(this.mql.matches);
    this.mql.addEventListener('change', this.mqlListener);

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
    const totalShips = new Set(this.myBoard().map(c => c.ship).filter(Boolean)).size;
    this.myShipsLeft.set(totalShips);
    this.opponentShipsLeft.set(totalShips);

    this.socketService.on<{ socketId: string; timeLimit: number }>('turn_start', ({ socketId, timeLimit }) => {
      if (this.gameOver()) return;
      const mine = socketId === this.socketService.socketId;
      this.isMyTurn.set(mine);
      if (mine) {
        this.clearResultTimeout();
        if (this.defenderNeedsDelay) {
          // Opponent just fired — keep MY BOARD visible 2s so user sees the result
          this.defenderNeedsDelay = false;
          this.resultTimeout = setTimeout(() => {
            this.showAttack.set(true);
            this.resultTimeout = null;
          }, 2000);
        } else {
          this.showAttack.set(true);
        }
      }
      this.startTimer(timeLimit);
    });

    this.socketService.on<{
      shooterSocketId: string; cellIndex: number; hit: boolean;
      shipName: string | null; shipSunk: boolean; gameOver: boolean;
    }>('shot_result', (data) => {
      const isMine = data.shooterSocketId === this.socketService.socketId;
      const type: AnnouncementType = data.shipSunk ? 'sunk' : data.hit ? 'hit' : 'miss';
      const text = data.shipSunk ? 'SUNK!' : data.hit ? 'HIT!' : 'MISSED!';
      this.showAnnouncement(text, type);

      if (isMine) {
        const b = [...this.attackBoard()];
        b[data.cellIndex] = { ...b[data.cellIndex], hasBeenShot: true, ship: data.hit ? (data.shipName ?? 'hit') : undefined };
        this.attackBoard.set(b);
        if (data.hit) {
          this.shakeAttackBoard.set(data.cellIndex);
          setTimeout(() => this.shakeAttackBoard.set(null), 350);
        }
        if (data.shipSunk) this.opponentShipsLeft.update(n => n - 1);
        // Keep ATTACK BOARD shown 2s so user sees the result, then switch to MY BOARD
        this.clearResultTimeout();
        this.resultTimeout = setTimeout(() => {
          if (!this.isMyTurn()) this.showAttack.set(false);
          this.resultTimeout = null;
        }, 2000);
      } else {
        const b = [...this.myBoard()];
        b[data.cellIndex] = { ...b[data.cellIndex], hasBeenShot: true };
        this.myBoard.set(b);
        if (data.hit) {
          this.shakeMyBoard.set(data.cellIndex);
          setTimeout(() => this.shakeMyBoard.set(null), 350);
        }
        if (data.shipSunk) this.myShipsLeft.update(n => n - 1);
        // Flag: next turn_start (my turn) should delay before showing ATTACK BOARD
        this.defenderNeedsDelay = true;
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
    this.mql?.removeEventListener('change', this.mqlListener);
    this.stopTimer();
    this.clearResultTimeout();
    this.clearAnnouncementTimeout();
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

  private showAnnouncement(text: string, type: AnnouncementType): void {
    this.clearAnnouncementTimeout();
    this.announcement.set({ text, type });
    this.announcementTimeout = setTimeout(() => {
      this.announcement.set(null);
      this.announcementTimeout = null;
    }, 1800);
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

  private clearAnnouncementTimeout(): void {
    if (this.announcementTimeout) { clearTimeout(this.announcementTimeout); this.announcementTimeout = null; }
  }
}
