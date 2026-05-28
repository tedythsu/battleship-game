import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { SocketService } from 'src/app/core/services/socket.service';

@Component({
  selector: 'app-online-lobby',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './online-lobby.component.html',
  styleUrl: './online-lobby.component.scss',
})
export class OnlineLobbyComponent implements OnInit, OnDestroy {
  nickname = '';
  joinCode = '';
  roomCode = '';
  errorMessage = '';
  isWaiting = false;
  isConnecting = false;
  showColdStartHint = false;

  private coldStartTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(public socketService: SocketService, private router: Router) {}

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.stopConnecting();
    ['room_created', 'room_joined', 'placement_phase', 'room_error', 'connect_error', 'disconnect']
      .forEach(e => this.socketService.off(e));
  }

  createRoom(): void {
    if (!this.nickname.trim() || this.isConnecting) return;
    this.startConnecting();
    this.socketService.connect();
    this.setupSocketListeners();
    this.socketService.gameState.myNickname = this.nickname.trim().toUpperCase();
    this.socketService.emit('create_room', { nickname: this.socketService.gameState.myNickname });
  }

  joinRoom(): void {
    if (!this.nickname.trim() || !this.joinCode.trim() || this.isConnecting) return;
    this.startConnecting();
    this.socketService.connect();
    this.setupSocketListeners();
    this.socketService.gameState.myNickname = this.nickname.trim().toUpperCase();
    this.socketService.emit('join_room', {
      roomCode: this.joinCode.trim().toUpperCase(),
      nickname: this.socketService.gameState.myNickname,
    });
  }

  cancel(): void {
    this.stopConnecting();
    this.socketService.disconnect();
    this.isWaiting = false;
    this.roomCode = '';
    this.errorMessage = '';
  }

  private startConnecting(): void {
    this.isConnecting = true;
    this.errorMessage = '';
    this.showColdStartHint = false;
    this.coldStartTimer = setTimeout(() => {
      if (this.isConnecting) this.showColdStartHint = true;
    }, 6000);
  }

  private stopConnecting(): void {
    this.isConnecting = false;
    this.showColdStartHint = false;
    if (this.coldStartTimer) { clearTimeout(this.coldStartTimer); this.coldStartTimer = null; }
  }

  private setupSocketListeners(): void {
    ['room_created', 'room_joined', 'placement_phase', 'room_error', 'connect_error', 'disconnect']
      .forEach(e => this.socketService.off(e));

    this.socketService.on<{ roomCode: string }>('room_created', ({ roomCode }) => {
      this.stopConnecting();
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
      this.stopConnecting();
      this.errorMessage = message;
    });

    this.socketService.on('connect_error', () => {
      this.stopConnecting();
      this.errorMessage = 'CONNECTION FAILED. PLEASE TRY AGAIN.';
      this.isWaiting = false;
    });

    this.socketService.on('disconnect', () => {
      if (this.isWaiting) {
        this.errorMessage = 'DISCONNECTED FROM SERVER.';
        this.isWaiting = false;
      }
    });
  }
}
