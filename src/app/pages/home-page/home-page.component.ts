import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AlertService } from 'src/app/core/services/alert.service';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss'
})
export class HomePageComponent {

  constructor(private router: Router, private alertService: AlertService) {}

  get isOnMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  navigateToGame(gameMode: string) {
    if (gameMode === 'Multi Player' && this.isOnMobileDevice) {
      this.alertService.showModal(`2 players mode is not available on mobile device!`);
    } else {
      this.router.navigate(["game"], {state: {gameMode: gameMode}});
    }
  }
}
