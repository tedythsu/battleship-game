import { Injectable, ApplicationRef, createComponent, EnvironmentInjector } from '@angular/core';
import { AlertModalComponent } from 'src/app/shared/alert-modal/alert-modal.component';

@Injectable({ providedIn: 'root' })
export class AlertService {
  private componentRef: ReturnType<typeof createComponent<AlertModalComponent>> | null = null;

  constructor(
    private appRef: ApplicationRef,
    private environmentInjector: EnvironmentInjector,
  ) {}

  showModal(message: string): void {
    if (this.componentRef) return;

    const ref = createComponent(AlertModalComponent, {
      environmentInjector: this.environmentInjector,
    });

    this.appRef.attachView(ref.hostView);
    document.body.appendChild(ref.location.nativeElement);
    this.componentRef = ref;
    ref.changeDetectorRef.detectChanges();
    ref.instance.show(message);

    ref.instance.closed.subscribe(() => setTimeout(() => this.destroy(), 250));
  }

  private destroy(): void {
    if (!this.componentRef) return;
    this.appRef.detachView(this.componentRef.hostView);
    this.componentRef.destroy();
    this.componentRef = null;
  }
}
