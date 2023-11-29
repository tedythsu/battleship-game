import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SidenavService {

  isSidenavOpen: boolean = false;

  constructor() { }

  public toggle(): void {
    this.isSidenavOpen = !this.isSidenavOpen;
  }
}
