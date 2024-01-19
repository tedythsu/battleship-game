import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AlertService } from './alert.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private router: Router, private alertService: AlertService) { }

  isLoggedIn: boolean = false;
  username: string = '';

  public logout(): void {
    this.isLoggedIn = false;
    this.router.navigate(['/login']);
    this.alertService.showModal('Logout successful');
  }
}
