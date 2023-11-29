import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidenavService } from '../../services/sidenav.service';

@Component({
  selector: 'app-sidenav',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidenav.component.html',
  styleUrl: './sidenav.component.scss'
})
export class SidenavComponent {

  constructor(private sidenav: SidenavService) { }

  get isSidenavOpen() {
    return this.sidenav.isSidenavOpen;
  }
}
