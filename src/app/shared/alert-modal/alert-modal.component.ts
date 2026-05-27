import { Component, ElementRef, EventEmitter, Output, ViewChild } from '@angular/core';

@Component({
  selector: 'app-alert-modal',
  standalone: true,
  imports: [],
  templateUrl: './alert-modal.component.html',
  styleUrl: './alert-modal.component.scss'
})
export class AlertModalComponent {
  @ViewChild('dialogRef') dialogRef!: ElementRef<HTMLDialogElement>;
  @Output() closed = new EventEmitter<void>();

  dialogMessage = '';

  show(message: string): void {
    this.dialogMessage = message;
    this.dialogRef.nativeElement.showModal();
  }

  close(): void {
    this.dialogRef.nativeElement.close();
    this.closed.emit();
  }
}
