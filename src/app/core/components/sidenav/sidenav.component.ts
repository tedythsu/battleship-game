import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidenavService } from '../../services/sidenav.service';
import { RouterModule } from '@angular/router';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-sidenav',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidenav.component.html',
  styleUrl: './sidenav.component.scss'
})
export class SidenavComponent implements OnInit {

  constructor(
    private sidenav: SidenavService,
  ) {}

  ngOnInit(): void {
  }

  get isSidenavOpen() {
    return this.sidenav.isSidenavOpen;
  }

  public sidenavToggle() {
    this.sidenav.toggle();
  }
}
