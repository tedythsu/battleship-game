import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss',
})
export class HomePageComponent {
  constructor(private router: Router) {}

  navigateToGame() {
    this.router.navigate(['game'], { state: { gameMode: 'Single Player' } });
  }

  navigateToOnline() {
    this.router.navigate(['online']);
  }
}
