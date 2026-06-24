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

  info(detail: string, summary = 'Info'): void {
    this.msg.add({ severity: 'info', summary, detail, life: 3500 });
  }
}
