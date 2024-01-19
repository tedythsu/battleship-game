import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AlertService } from 'src/app/core/services/alert.service';

@Component({
  selector: 'app-signup-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './signup-page.component.html',
  styleUrl: './signup-page.component.scss'
})
export class SignupPageComponent {

  constructor(private alertService: AlertService) {}

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
    const id = this.signupForm.value.id;
    if (id && !this.checkIfIdIsRegistered(id)) {
      this.performRegistration();
    } else {
      this.alertService.showModal('This ID is already registered');
    }
  }

  private checkIfIdIsRegistered(id: string): boolean {
    const isIdRegistered = sessionStorage.getItem(id);
    return !!isIdRegistered ? true : false;
  }

  private performRegistration(): void {
    const user = {
      password: this.signupForm.value.password,
      username: this.signupForm.value.username,
    };

    sessionStorage.setItem(
      this.signupForm.value.id!,
      JSON.stringify(user)
    );

    this.alertService.showModal('Registration successful!');
  }

}
