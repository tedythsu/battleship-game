import { Injectable, ComponentFactoryResolver, ApplicationRef, Injector, EmbeddedViewRef } from '@angular/core';
import { AlertModalComponent } from 'src/app/shared/alert-modal/alert-modal.component';

@Injectable({
  providedIn: 'root',
})
export class AlertService {
  private alertModalRef: EmbeddedViewRef<any> | null = null;

  constructor(
    private resolver: ComponentFactoryResolver, // FIXME:
    private appRef: ApplicationRef,
    private injector: Injector,
  ) {}

  showModal(message: string): void {
    if (!this.alertModalRef) {
      // Create the factory for AlertModalComponent
      const factory = this.resolver.resolveComponentFactory(AlertModalComponent);

      // Create an instance of AlertModalComponent
      const componentRef = factory.create(this.injector);

      // Set the message
      componentRef.instance.dialogMessage = message;

      // Attach the instance of AlertModalComponent to the application's DOM
      this.appRef.attachView(componentRef.hostView);

      // Get the DOM element of AlertModalComponent
      const domElem = (componentRef.hostView as EmbeddedViewRef<any>).rootNodes[0] as HTMLElement;

      // Append the DOM element to the body
      document.body.appendChild(domElem);

      // Set alertModalRef
      this.alertModalRef = componentRef.hostView as EmbeddedViewRef<any>;

      componentRef.instance.showModal(message);

      // Implement the logic to close the modal
      componentRef.instance.closeModal = () => {
        const dialog = document.querySelector("dialog");
        dialog?.close();

        setTimeout(() => {
          if (this.alertModalRef) {
            this.appRef.detachView(this.alertModalRef);
            this.alertModalRef.destroy();
            this.alertModalRef = null;
          }
        }, 250);
      };
    }
  }
}
