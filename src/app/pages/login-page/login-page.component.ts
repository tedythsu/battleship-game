import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss'
})
export class LoginPageComponent {

  constructor(private authService: AuthService) {}

  loginForm = new FormGroup({
    id: new FormControl('', [Validators.required, this.taiwanIdValidator]),
    password: new FormControl('', Validators.required),
  });

  private taiwanIdValidator(control: AbstractControl): { [key: string]: any } | null {
    const value: string = control.value;

    const regex = /^[A-Z][1-2]\d{8}$/;
    if (!regex.test(value)) {
      return { 'invalidTaiwanId': true };
    }

    return null;
  }

  public onLoginClick(): void {
    const id = this.loginForm.value.id as string;
    const password = this.loginForm.value.password as string;
    this.authService.authenticateUser(id, password);
  }

}
