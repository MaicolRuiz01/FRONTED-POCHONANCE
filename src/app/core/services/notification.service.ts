import { Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  constructor(private msg: MessageService) {}

  success(detail: string, summary = 'Éxito'): void {
    this.msg.add({ severity: 'success', summary, detail, life: 3500 });
  }

  error(detail: string, summary = 'Error'): void {
    this.msg.add({ severity: 'error', summary, detail, life: 5000 });
  }

  warn(detail: string, summary = 'Atención'): void {
    this.msg.add({ severity: 'warn', summary, detail, life: 4000 });
  }

  /**
   * Aviso grande y fijo (no se quita solo) para ventas peligrosas. Va por una llave propia: solo lo muestra el
   * <p-toast key="venta-grande"> de la pantalla P2P, para que no salga duplicado en el toast general.
   */
  ventaGrande(summary: string, detail: string, severity: 'warn' | 'error' = 'warn'): void {
    this.msg.add({ key: 'venta-grande', severity, summary, detail, sticky: true });
  }

  info(detail: string, summary = 'Info'): void {
    this.msg.add({ severity: 'info', summary, detail, life: 3500 });
  }
}
