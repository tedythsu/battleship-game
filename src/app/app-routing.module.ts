import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomePageComponent } from './pages/home-page/home-page.component';
import { GamePageComponent } from './pages/game-page/game-page.component';
import { SettingsPageComponent } from './pages/settings-page/settings-page.component';
import { OnlineLobbyComponent } from './pages/online-lobby/online-lobby.component';
import { OnlinePlacementComponent } from './pages/online-placement/online-placement.component';
import { OnlineGameComponent } from './pages/online-game/online-game.component';
import { placementGuard, gameGuard } from './core/guards/online-session.guard';

const routes: Routes = [
  { path: '', component: HomePageComponent, pathMatch: 'full' },
  { path: 'game', component: GamePageComponent },
  { path: 'settings', component: SettingsPageComponent },
  { path: 'online', component: OnlineLobbyComponent },
  { path: 'online/place', component: OnlinePlacementComponent, canActivate: [placementGuard] },
  { path: 'online/game', component: OnlineGameComponent, canActivate: [gameGuard] },
  { path: '**', redirectTo: '' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
