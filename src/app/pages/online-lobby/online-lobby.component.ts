import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { SocketService } from 'src/app/core/services/socket.service';

@Component({
  selector: 'app-online-lobby',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
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
