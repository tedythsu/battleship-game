import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AlertService } from 'src/app/core/services/alert.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss'
})
export class LoginPageComponent {

  constructor(private alertService: AlertService, private authService: AuthService, private router: Router) {}

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
    const id = this.loginForm.value.id ?? '';
    const password = this.loginForm.value.password ?? '';
    this.authenticateUser(id, password);
  }

  private authenticateUser(id: string, password: string): void {
    const accountData = sessionStorage.getItem(id);

    if (accountData) {
      const accountPassword = JSON.parse(accountData).password;
      if (password === accountPassword) {
        const accountUsername = JSON.parse(accountData).username;
        this.authService.isLoggedIn = true;
        this.authService.username = accountUsername;
        this.alertService.showModal('Login successful');
        this.router.navigate(['/settings']);
      } else {
        this.alertService.showModal('Incorrect password');
      }
    } else {
      this.alertService.showModal('Account does not exist');
    }
  }

}
