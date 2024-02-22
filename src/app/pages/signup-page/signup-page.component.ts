import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { UserService, User, GameMode, Difficulty, BoardSize } from 'src/app/core/services/user.service';

@Component({
  selector: 'app-signup-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './signup-page.component.html',
  styleUrl: './signup-page.component.scss'
})
export class SignupPageComponent {

  constructor(private userService: UserService) {}

  signupForm = new FormGroup({
    id: new FormControl('', [Validators.required, this.taiwanIdValidator]),
    password: new FormControl('', Validators.required),
    username: new FormControl('', Validators.required),
  });

  private taiwanIdValidator(control: AbstractControl): { [key: string]: any } | null {
    const value: string = control.value;

    const regex = /^[A-Z][1-2]\d{8}$/;
    if (!regex.test(value)) {
      return { 'invalidTaiwanId': true };
    }

    return null;
  }

  public onSignUpClick(): void {
    const user: User = {
      id: this.signupForm.value.id ?? '',
      password: this.signupForm.value.password ?? '',
      username: this.signupForm.value.username ?? '',
      boardSize: BoardSize._6x6,
      gameMode: GameMode.SINGLE_PLAYER,
      difficulty: Difficulty.EASY
    }

    this.userService.registerUser(user);
  }

}
