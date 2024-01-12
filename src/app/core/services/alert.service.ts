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
      // 創建 AlertModalComponent 的 factory
      const factory = this.resolver.resolveComponentFactory(AlertModalComponent);

      // 創建 AlertModalComponent 的實例
      const componentRef = factory.create(this.injector);

      // 設定提示訊息
      componentRef.instance.dialogMessage = message;

      // 將 AlertModalComponent 的實例插入到應用的 DOM 中
      this.appRef.attachView(componentRef.hostView);

      // 獲取 AlertModalComponent 的 DOM 元素
      const domElem = (componentRef.hostView as EmbeddedViewRef<any>).rootNodes[0] as HTMLElement;

      // 將 DOM 元素附加到 body 中
      document.body.appendChild(domElem);

      // 設定 alertModalRef
      this.alertModalRef = componentRef.hostView as EmbeddedViewRef<any>;

      componentRef.instance.showModal(message);

      // 實現關閉 modal 的邏輯
      componentRef.instance.closeModal = () => {
        this.closeModal();
      };
    }
  }

  closeModal(): void {
    if (this.alertModalRef) {
      // 釋放資源
      this.appRef.detachView(this.alertModalRef);
      this.alertModalRef.destroy();
      this.alertModalRef = null;
    }
  }
}
