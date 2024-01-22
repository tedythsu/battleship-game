import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AlertService } from './alert.service';
import { UserService, User } from './user.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(
    private router: Router,
    private alertService: AlertService,
    private userService: UserService) { }

  isLoggedIn: boolean = false;

  /**
   * Authenticates the user based on provided credentials.
   * If successful, sets the user as logged in and navigates to the settings page.
   * Displays appropriate alerts for success or failure.
   */
  public authenticateUser(inputId: string, inputPassword: string): void {
    const userData: User | null = this.userService.getUserData(inputId);

    if (userData) {
      if (inputPassword === userData.password) {
        this.login(userData);
        this.alertService.showModal(`Welcome, ${userData.username}!`);
        this.router.navigate(['/settings']);
      } else {
        this.alertService.showModal('Incorrect password');
      }
    } else {
      this.alertService.showModal('Account does not exist');
    }
  }

  public login(userData: User): void {
    this.isLoggedIn = true;
    this.userService.setCurrentUser(userData);
  }

  public logout(): void {
    this.isLoggedIn = false;
    this.router.navigate(['/login']);
    this.alertService.showModal('Logout successful');
  }
}
