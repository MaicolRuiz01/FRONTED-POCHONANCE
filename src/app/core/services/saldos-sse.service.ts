import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { environment } from '../../../environment/environment';
import { AuthService } from './auth.service';

/**
 * SSE de saldos de cuentas COP. Cuando el backend detecta un cambio de saldo
 * (retiro, pago, gasto, asignación P2P, ajuste, traspaso…) emite un evento y
 * este servicio avisa por cambioSaldos$ para que las vistas refresquen al instante.
 */
@Injectable({ providedIn: 'root' })
export class SaldosSseService implements OnDestroy {
  private eventSource: EventSource | null = null;
  private reconnectTimer?: ReturnType<typeof setTimeout>;

  private cambioSaldosSubject = new Subject<void>();
  cambioSaldos$ = this.cambioSaldosSubject.asObservable();

  constructor(private zone: NgZone, private auth: AuthService) {}

  connect(): void {
    if (this.eventSource) return;

    const token = this.auth.getToken();
    const url = `${environment.apiUrl}/saldos-events/subscribe${token ? '?token=' + encodeURIComponent(token) : ''}`;
    this.eventSource = new EventSource(url);

    this.eventSource.addEventListener('saldos-cambiaron', () => {
      this.zone.run(() => this.cambioSaldosSubject.next());
    });

    this.eventSource.onerror = () => {
      this.zone.run(() => {
        this.disconnect();
        this.reconnectTimer = setTimeout(() => this.connect(), 2000);
      });
    };
  }

  disconnect(): void {
    clearTimeout(this.reconnectTimer);
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  ngOnDestroy(): void {
    this.disconnect();
    this.cambioSaldosSubject.complete();
  }
}
