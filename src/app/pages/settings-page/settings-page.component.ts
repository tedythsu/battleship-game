import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './settings-page.component.html',
  styleUrl: './settings-page.component.scss'
})
export class SettingsPageComponent implements OnInit {

  constructor() {}

  ngOnInit(): void {
  }

  settingsForm = new FormGroup({
    id: new FormControl('', Validators.required),
    password: new FormControl('', Validators.required),
    username: new FormControl('', Validators.required),
    boardSize: new FormControl(0, Validators.required),
    gameMode: new FormControl('', Validators.required),
    difficulty: new FormControl('', Validators.required),
  });


}
