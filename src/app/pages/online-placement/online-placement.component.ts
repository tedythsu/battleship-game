import { Component, OnInit, OnDestroy, WritableSignal, signal } from '@angular/core';
import { Router } from '@angular/router';
import { SocketService, BoardCell } from 'src/app/core/services/socket.service';

interface Ship { name: string; size: number; placed: WritableSignal<boolean>; }

enum Dir { Right = 'Right', Down = 'Down', Left = 'Left', Up = 'Up' }

@Component({
  selector: 'app-online-placement',
  standalone: true,
  imports: [],
  templateUrl: './online-placement.component.html',
  styleUrl: './online-placement.component.scss',
})
export class OnlinePlacementComponent implements OnInit, OnDestroy {
  readonly N = 8;
  readonly letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  readonly rows = Array.from({ length: 8 }, (_, i) => i);
  readonly cols = Array.from({ length: 8 }, (_, i) => i);

  ships: Ship[] = [
    { name: 'Destroyer', size: 2, placed: signal(false) },
    { name: 'Cruiser', size: 3, placed: signal(false) },
    { name: 'Battleship', size: 4, placed: signal(false) },
  ];

  board: WritableSignal<BoardCell[]> = signal([]);
  selected: Ship | null = null;
  dir: Dir = Dir.Right;
  hovered: number[] = [];
  isWaiting = false;
  myNickname = '';

  get allPlaced(): boolean {
    return this.board().length > 0 && this.ships.every(s => s.placed());
  }

  get shipsRemaining(): number {
    return this.ships.filter(s => !s.placed()).length;
  }

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
    this.ships.forEach(s => s.placed.set(false));
    this.selected = null;
    this.hovered = [];
  }

  selectShip(ship: Ship): void {
    if (ship.placed()) return;
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
    this.selected!.placed.set(true);
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
    const emptyBoard = (): BoardCell[] => Array.from({ length: this.N * this.N }, (_, i) => ({
      location: this.letters[Math.floor(i / this.N)] + ((i % this.N) + 1),
      hasBeenShot: false,
    }));

    let b: BoardCell[] = [];
    let success = false;
    while (!success) {
      b = emptyBoard();
      success = this.ships.every(ship => {
        for (let tries = 0; tries < 200; tries++) {
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
            return true;
          }
        }
        return false;
      });
    }

    this.ships.forEach(s => s.placed.set(true));
    this.board.set(b);
    this.selected = null;
    this.hovered = [];
  }

  reset(): void { this.initBoard(); }

  confirm(): void {
    if (!this.allPlaced) return;
    this.isWaiting = true;
    this.socketService.gameState.myBoard = this.board();
    this.socketService.emit('submit_board', { cells: this.board() });
  }

  isHovered(i: number): boolean { return this.hovered.includes(i); }
}
