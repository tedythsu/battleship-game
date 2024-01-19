import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AlertService } from 'src/app/core/services/alert.service';

interface User {
  id: string,
  password: string,
  username: string
}

@Component({
  selector: 'app-signup-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './signup-page.component.html',
  styleUrl: './signup-page.component.scss'
})
export class SignupPageComponent {

  constructor(private alertService: AlertService, private router: Router) {}

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
      username: this.signupForm.value.username ?? ''
    }

    if (!this.checkIfIdIsRegistered(user.id)) {
      this.performRegistration(user);
    } else {
      this.alertService.showModal('This ID is already registered');
    }
  }

  private checkIfIdIsRegistered(id: string): boolean {
    const isIdRegistered = sessionStorage.getItem(id);
    return !!isIdRegistered ? true : false;
  }

  private performRegistration(user: User): void {
    sessionStorage.setItem(
      btoa(user.id),
      btoa(JSON.stringify(user))
    );

    this.alertService.showModal('Registration successful!');
    this.router.navigate(['/login']);
  }

}
