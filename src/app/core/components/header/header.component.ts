import { Component, signal, effect, WritableSignal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { SidenavService } from '../../services/sidenav.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {

  darkMode: WritableSignal<boolean> = signal(true);

  constructor(private sidenav: SidenavService, private location: Location) {
    effect(() => {
      this.darkMode() ? document.body.classList.remove('light-mode') : document.body.classList.add('light-mode');
    });
  }

  public toggleSidenav(): void {
    this.sidenav.toggle();
  }

  public toggleDarkMode(): void {
    this.darkMode.set(!this.darkMode());
  }

  public back(): void {
    this.location.back()
  }

}
