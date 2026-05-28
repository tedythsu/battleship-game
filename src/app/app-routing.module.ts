import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { placementGuard, gameGuard } from './core/guards/online-session.guard';

const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/home-page/home-page.component').then(m => m.HomePageComponent), pathMatch: 'full' },
  { path: 'game', loadComponent: () => import('./pages/game-page/game-page.component').then(m => m.GamePageComponent) },
  { path: 'online', loadComponent: () => import('./pages/online-lobby/online-lobby.component').then(m => m.OnlineLobbyComponent) },
  { path: 'online/place', loadComponent: () => import('./pages/online-placement/online-placement.component').then(m => m.OnlinePlacementComponent), canActivate: [placementGuard] },
  { path: 'online/game', loadComponent: () => import('./pages/online-game/online-game.component').then(m => m.OnlineGameComponent), canActivate: [gameGuard] },
  { path: '**', redirectTo: '' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
