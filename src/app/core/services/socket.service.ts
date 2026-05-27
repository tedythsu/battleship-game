import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from 'src/environments/environment';

export interface BoardCell {
  location: string;
  hasBeenShot: boolean;
  ship?: string;
}

export function generateEmptyBoard(n: number): BoardCell[] {
  const L = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  return Array.from({ length: n * n }, (_, i) => ({
    location: `${L[Math.floor(i / n)]}${(i % n) + 1}`,
    hasBeenShot: false,
  }));
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
