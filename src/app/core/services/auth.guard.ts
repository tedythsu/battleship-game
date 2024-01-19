import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { AlertService } from './alert.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard {

  constructor(private authService: AuthService,private router: Router, private alertService: AlertService) {}

  canActivate(): boolean {
    return this.checkAuth();
  }

  canActivateChild(): boolean {
    return this.checkAuth();
  }

  // TODO:
  // canDeactivate(component: ProudctRatingComponent): boolean {
  //   if (component.hasUnsavedChanges()) {
  //     return window.confirm('You have unsaved changes. Do you really want to leave?');
  //   }
  //   return true;
  // }

  canLoad(): boolean {
    return this.checkAuth();
  }

  private checkAuth(): boolean {
    if (this.authService.isLoggedIn) {
      return true;
    } else {
      this.alertService.showModal('Please log in first');
      // Redirect to the login page if the user is not authenticated
      this.router.navigate(['/login']);
      return false;
    }
  }

}
