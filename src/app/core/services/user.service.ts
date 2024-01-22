import { Injectable } from '@angular/core';

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

  constructor() { }

  currentUser: User = {
    id: '',
    password: '',
    username: '',
    gameMode: GameMode.SINGLE_PLAYER,
    difficulty: Difficulty.EASY
  }

  public setCurrentUser(user: User): void {
    this.currentUser = user;
  }

  public getCurrentUser(): User {
    return this.currentUser;
  }

  /** Get user data based on user ID */
  public getUserData(userId: string): User | null {
    // Retrieve Base64-encoded user data from Session Storage
    const base64UserData = sessionStorage.getItem(btoa(userId));

    // If it exists, decode and return the user information
    return base64UserData ? JSON.parse(atob(base64UserData)) as User : null;
  }

}
