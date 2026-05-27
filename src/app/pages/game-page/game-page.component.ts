import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-game-page',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './game-page.component.html',
  styleUrl: './game-page.component.scss',
})
export class GamePageComponent {
  constructor(private router: Router) {}
  exit(): void { this.router.navigate(['']); }
}
