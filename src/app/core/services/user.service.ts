import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AlertService } from './alert.service';

export enum GameMode {
  SINGLE_PLAYER = 'Single Player',
  MULTI_PLAYER = 'Multi Player'
}

export enum Difficulty {
  EASY = 'Easy',
  MEDIUM = 'Medium',
  HARD = 'Hard',
}

export interface User {
  id: string,
  password: string,
  username: string,
  gameMode: GameMode,
  difficulty: Difficulty,
}

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(
    private router: Router,
    private alertService: AlertService) { }

  currentUser: User = {
    id: '',
    password: '',
    username: '',
    gameMode: GameMode.SINGLE_PLAYER,
    difficulty: Difficulty.EASY
  }

  // Base64 encode function for encoding an ID
  private BASE64_ENCODE = (id: string) => btoa(id);

  public setCurrentUser(user: User): void {
    this.currentUser = user;
  }

  public getCurrentUser(): User {
    return this.currentUser;
  }

  /** Get user data based on user ID */
  public getUserData(userId: string): User | null {
    // Retrieve Base64-encoded user data from Session Storage
    const base64UserData = sessionStorage.getItem(this.BASE64_ENCODE(userId));

    // If it exists, decode and return the user information
    return base64UserData ? JSON.parse(atob(base64UserData)) as User : null;
  }

  /**
   * Registers a new user if the provided ID is not already registered.
   * @param user - The user object containing registration details.
   */
  public registerUser(user: User): void {
    if (!this.isIdRegistered(user.id)) {
      this.storeUserData(user);
      this.alertService.showModal('Registration successful!');
      this.router.navigate(['/login']);
    } else {
      this.alertService.showModal('This ID is already registered');
    }
  }

  /**
   * Stores user data in sessionStorage after encoding.
   * @param user - The user object to be stored.
   */
  private storeUserData(user: User): void {
    const encodedId = this.BASE64_ENCODE(user.id);
    const encodedUserData = this.BASE64_ENCODE(JSON.stringify(user));
    sessionStorage.setItem(encodedId, encodedUserData);
  }

  /**
   * Checks if the provided ID is registered by querying the sessionStorage.
   * @param id - The ID to check for registration.
   * @returns True if the ID is registered, false otherwise.
   */
  private isIdRegistered(id: string): boolean {
    return !!sessionStorage.getItem(this.BASE64_ENCODE(id));
  }

}
