import { Component, OnInit, OnDestroy, WritableSignal, signal, computed, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { SocketService, BoardCell, generateEmptyBoard } from 'src/app/core/services/socket.service';

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
    { name: 'Destroyer',  size: 2, placed: signal(false) },
    { name: 'Cruiser',    size: 3, placed: signal(false) },
    { name: 'Battleship', size: 4, placed: signal(false) },
  ];

  board: WritableSignal<BoardCell[]> = signal([]);
  selected: Ship | null = null;
  dir: WritableSignal<Dir> = signal(Dir.Right);
  hovered: number[] = [];
  isWaiting = false;
  myNickname = '';

  /* ── Drag state ── */
  dragging:  WritableSignal<Ship | null> = signal(null);
  ghostX:    WritableSignal<number>      = signal(0);
  ghostY:    WritableSignal<number>      = signal(0);
  dragCells: WritableSignal<number[]>    = signal([]);
  dragValid: WritableSignal<boolean>     = signal(false);

  ghostCells  = computed(() => Array.from({ length: this.dragging()?.size ?? 0 }, (_, i) => i));
  isGhostVert = computed(() => this.dir() === Dir.Down || this.dir() === Dir.Up);

  private pendingShip: Ship | null = null;
  private dragStartX = 0;
  private dragStartY = 0;
  private lastHoveredIdx = -1;
  private readonly DRAG_THRESHOLD_SQ = 36; // 6 px²

  get allPlaced(): boolean { return this.board().length > 0 && this.ships.every(s => s.placed()); }
  get shipsRemaining(): number { return this.ships.filter(s => !s.placed()).length; }

  constructor(private socketService: SocketService, private router: Router) {}

  ngOnInit(): void {
    this.myNickname = this.socketService.gameState.myNickname ?? '';
    this.initBoard();
    this.socketService.on('game_start', () => this.router.navigate(['online', 'game']));
  }

  ngOnDestroy(): void {
    this.socketService.off('game_start');
    document.body.classList.remove('is-dragging');
  }

  private initBoard(): void {
    this.board.set(generateEmptyBoard(this.N));
    this.ships.forEach(s => s.placed.set(false));
    this.selected = null;
    this.hovered = [];
    this.endDrag();
  }

  /* ── Ship item: pointer down (tap OR drag start) ── */
  onShipPointerDown(event: PointerEvent, ship: Ship): void {
    event.preventDefault();
    this.pendingShip = ship;
    this.dragStartX = event.clientX;
    this.dragStartY = event.clientY;
  }

  /* ── Global: track movement and commit drag after threshold ── */
  @HostListener('document:pointermove', ['$event'])
  onDocumentPointerMove(event: PointerEvent): void {
    if (this.dragging()) {
      this.ghostX.set(event.clientX);
      this.ghostY.set(event.clientY);
      return;
    }
    if (!this.pendingShip) return;
    const dx = event.clientX - this.dragStartX;
    const dy = event.clientY - this.dragStartY;
    if (dx * dx + dy * dy > this.DRAG_THRESHOLD_SQ) {
      const ship = this.pendingShip;
      this.pendingShip = null;
      // Pick up placed ship by removing it from the board
      if (ship.placed()) {
        this.board.set(this.board().map(c => c.ship === ship.name ? { ...c, ship: undefined } : c));
        ship.placed.set(false);
      }
      this.selected = null;
      this.hovered = [];
      this.dragging.set(ship);
      this.ghostX.set(event.clientX);
      this.ghostY.set(event.clientY);
      document.body.classList.add('is-dragging');
    }
  }

  /* ── Global: pointer up — tap or drop ── */
  @HostListener('document:pointerup')
  onDocumentPointerUp(): void {
    if (this.pendingShip) {
      const ship = this.pendingShip;
      this.pendingShip = null;
      if (!ship.placed()) this.selectShip(ship); // tap = select for click-to-place
      return;
    }
    if (!this.dragging()) return;
    if (this.dragValid() && this.dragCells().length) this.commitPlace(this.dragging()!, this.dragCells());
    this.endDrag();
  }

  /* ── Right-click: rotate during drag ── */
  @HostListener('document:contextmenu', ['$event'])
  onContextMenu(event: MouseEvent): void {
    if (!this.pendingShip && !this.dragging()) return;
    event.preventDefault();
    this.rotate();
  }

  /* ── Keyboard shortcuts ── */
  @HostListener('document:keydown.r')
  onKeyR(): void { this.rotate(); }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.pendingShip) { this.pendingShip = null; return; }
    if (this.dragging()) { this.endDrag(); return; }
    this.selected = null;
    this.hovered = [];
  }

  /* ── Board cell events ── */
  onCellEnter(i: number): void {
    this.lastHoveredIdx = i;
    const ship = this.dragging() ?? this.selected;
    if (!ship) { this.hovered = []; return; }
    const idxs = this.indexes(i, this.dir(), ship.size);
    this.hovered = idxs;
    if (this.dragging()) {
      this.dragCells.set(idxs);
      this.dragValid.set(this.valid(idxs));
    }
  }

  onCellLeave(): void {
    this.lastHoveredIdx = -1;
    this.hovered = [];
    if (this.dragging()) {
      this.dragCells.set([]);
      this.dragValid.set(false);
    }
  }

  onCellClick(i: number): void {
    if (this.dragging() || !this.selected) return;
    const idxs = this.indexes(i, this.dir(), this.selected.size);
    if (!this.valid(idxs)) return;
    this.commitPlace(this.selected, idxs);
    this.selected = null;
    this.hovered = [];
  }

  /* ── Hover CSS helpers ── */
  isHoveredValid(i: number): boolean {
    if (this.dragging()) return this.dragCells().includes(i) && this.dragValid();
    return this.hovered.includes(i) && this.valid(this.hovered);
  }

  isHoveredInvalid(i: number): boolean {
    if (this.dragging()) return this.dragCells().includes(i) && !this.dragValid();
    return this.hovered.includes(i) && !this.valid(this.hovered);
  }

  /* ── Ship selection (click-to-place fallback) ── */
  selectShip(ship: Ship): void {
    if (ship.placed()) return;
    this.selected = this.selected === ship ? null : ship;
    this.hovered = [];
  }

  /* ── Rotation (UI button, right-click, or R key) ── */
  rotate(): void {
    const dirs = [Dir.Right, Dir.Down, Dir.Left, Dir.Up];
    this.dir.set(dirs[(dirs.indexOf(this.dir()) + 1) % 4]);
    this.hovered = [];
    if (this.lastHoveredIdx < 0) return;
    const ship = this.dragging() ?? this.selected;
    if (!ship) return;
    const idxs = this.indexes(this.lastHoveredIdx, this.dir(), ship.size);
    this.hovered = idxs;
    if (this.dragging()) {
      this.dragCells.set(idxs);
      this.dragValid.set(this.valid(idxs));
    }
  }

  /* ── Randomize & controls ── */
  randomize(): void {
    const dirs = [Dir.Right, Dir.Down, Dir.Left, Dir.Up];
    let b: BoardCell[] = [];
    let success = false;
    while (!success) {
      b = generateEmptyBoard(this.N);
      success = this.ships.every(ship => {
        for (let tries = 0; tries < 200; tries++) {
          const start = Math.floor(Math.random() * b.length);
          const dir = dirs[Math.floor(Math.random() * 4)];
          const idxs = this.indexes(start, dir, ship.size);
          const total = this.N * this.N;
          const noOob     = idxs.every(i => i >= 0 && i < total);
          const noOverlap = idxs.every(i => !b[i].ship);
          const noWrap    = [Dir.Right, Dir.Left].includes(dir)
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

  /* ── Private helpers ── */
  private commitPlace(ship: Ship, idxs: number[]): void {
    const b = [...this.board()];
    idxs.forEach(idx => b[idx] = { ...b[idx], ship: ship.name });
    this.board.set(b);
    ship.placed.set(true);
  }

  private endDrag(): void {
    this.dragging.set(null);
    this.dragCells.set([]);
    this.dragValid.set(false);
    this.hovered = [];
    this.lastHoveredIdx = -1;
    this.pendingShip = null;
    document.body.classList.remove('is-dragging');
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
    const d = this.dir();
    if (d === Dir.Right || d === Dir.Left) {
      const rows = idxs.map(i => Math.floor(i / this.N));
      if (rows.some(r => r !== rows[0])) return false;
    }
    return idxs.every(i => !this.board()[i].ship);
  }
}
