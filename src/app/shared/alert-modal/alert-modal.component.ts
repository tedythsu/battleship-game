import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-alert-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './alert-modal.component.html',
  styleUrl: './alert-modal.component.scss'
})
export class AlertModalComponent {

  dialogMessage: string = '';

  public showModal(message: string): void {
    const dialog = document.querySelector("dialog");
    this.dialogMessage = message;
    dialog?.showModal();
  }

  public closeModal(): void {
    const dialog = document.querySelector("dialog");
    dialog?.close();
  }

}
