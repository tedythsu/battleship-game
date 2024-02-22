import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth.service';
import { UserService, BoardSize, GameMode, Difficulty, User } from 'src/app/core/services/user.service';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './settings-page.component.html',
  styleUrl: './settings-page.component.scss'
})
export class SettingsPageComponent implements OnInit {

  constructor(private authService: AuthService, private userService: UserService) {}

  boardSize = BoardSize;
  gameMode = GameMode;
  difficulty = Difficulty;

  user: User = this.userService.currentUser;

  settingsForm = new FormGroup({
    id: new FormControl('', Validators.required),
    password: new FormControl('', Validators.required),
    username: new FormControl('', Validators.required),
    boardSize: new FormControl(0, Validators.required),
    gameMode: new FormControl('', Validators.required),
    difficulty: new FormControl('', Validators.required),
  });

  ngOnInit(): void {
    this.user = this.userService.getCurrentUser();
    console.log(this.user);
    this.settingsForm.get('id')?.setValue(this.user.id);
    this.settingsForm.get('password')?.setValue(this.user.password);
    this.settingsForm.get('username')?.setValue(this.user.username);
    this.settingsForm.get('boardSize')?.setValue(this.user.boardSize);
    this.settingsForm.get('gameMode')?.setValue(this.user.gameMode);
    this.settingsForm.get('difficulty')?.setValue(this.user.difficulty);
    console.log(this.settingsForm.value);
  }

  public onSaveClick(): void {
    // const id = this.settingsForm.value.id as string;
    // const password = this.settingsForm.value.password as string;
    // this.authService.authenticateUser(id, password);
    // console.log(GameMode.SINGLE_PLAYER)
    console.log(this.settingsForm.value);
    console.log(this.userService.currentUser);
    this.userService.updateUser(this.settingsForm.value);
  }

}
