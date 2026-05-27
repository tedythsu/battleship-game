import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SocketService } from '../services/socket.service';

export const placementGuard: CanActivateFn = () => {
  const socket = inject(SocketService);
  const router = inject(Router);
  return socket.gameState.myNickname ? true : router.createUrlTree(['']);
};

export const gameGuard: CanActivateFn = () => {
  const socket = inject(SocketService);
  const router = inject(Router);
  return socket.gameState.myBoard ? true : router.createUrlTree(['']);
};
