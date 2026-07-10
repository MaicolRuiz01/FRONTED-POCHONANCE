import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { environment } from '../../../environment/environment';
import { AuthService } from './auth.service';

/**
 * SSE de saldos de cuentas COP. Cuando el backend detecta un cambio de saldo
 * (retiro, pago, gasto, asignación P2P, ajuste, traspaso…) emite un evento y
 * este servicio avisa por cambioSaldos$ para que las vistas refresquen al instante.
 *
 * Railway (proxy HTTP/2) a veces rompe las conexiones SSE (502 / ERR_HTTP2_PROTOCOL_ERROR).
 * Por eso: reconexión con BACKOFF y, si el SSE sigue fallando, se deja de intentar y se pasa
 * a POLLING de respaldo (emite cambioSaldos$ cada cierto tiempo) para que las vistas refresquen
 * igual, sin inundar la consola de errores.
 */
@Injectable({ providedIn: 'root' })
export class SaldosSseService implements OnDestroy {
  private eventSource: EventSource | null = null;
  private reconnectTimer?: ReturnType<typeof setTimeout>;
  private pollTimer?: ReturnType<typeof setInterval>;

  private reconnectDelay = 2000;
  private readonly MAX_DELAY = 60000;
  private failCount = 0;
  /** Tras estos fallos seguidos, dejamos de intentar SSE y quedamos SOLO en polling. */
  private readonly MAX_SSE_ATTEMPTS = 4;
  /** Cada cuánto refresca el polling de respaldo (ms). */
  private readonly POLL_MS = 30000;
  private darsePorVencido = false;

  private cambioSaldosSubject = new Subject<void>();
  cambioSaldos$ = this.cambioSaldosSubject.asObservable();

  constructor(private zone: NgZone, private auth: AuthService) {}

  connect(): void {
    if (this.eventSource || this.darsePorVencido) return;

    const token = this.auth.getToken();
    const url = `${environment.apiUrl}/saldos-events/subscribe${token ? '?token=' + encodeURIComponent(token) : ''}`;
    this.eventSource = new EventSource(url);

    // Conectó bien → reiniciar contadores y apagar el polling de respaldo.
    this.eventSource.onopen = () => {
      this.zone.run(() => {
        this.failCount = 0;
        this.reconnectDelay = 2000;
        this.stopPolling();
      });
    };

    this.eventSource.addEventListener('saldos-cambiaron', () => {
      this.zone.run(() => this.cambioSaldosSubject.next());
    });

    this.eventSource.onerror = () => {
      this.zone.run(() => {
        this.closeEventSource();
        this.failCount++;

        if (this.failCount >= this.MAX_SSE_ATTEMPTS) {
          // Railway no está dejando el SSE → nos quedamos en polling y no volvemos a spamear.
          this.darsePorVencido = true;
          this.startPolling();
          return;
        }

        // Reintento con backoff exponencial (tope 60s) para no martillar cada 2s.
        this.reconnectTimer = setTimeout(() => this.connect(), this.reconnectDelay);
        this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.MAX_DELAY);
      });
    };
  }

  /** Polling de respaldo: avisa a las vistas para que refresquen los saldos por HTTP normal. */
  private startPolling(): void {
    if (this.pollTimer) return;
    this.pollTimer = setInterval(
      () => this.zone.run(() => this.cambioSaldosSubject.next()),
      this.POLL_MS
    );
  }

  private stopPolling(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = undefined;
    }
  }

  private closeEventSource(): void {
    clearTimeout(this.reconnectTimer);
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  disconnect(): void {
    this.closeEventSource();
    this.stopPolling();
  }

  ngOnDestroy(): void {
    this.disconnect();
    this.cambioSaldosSubject.complete();
  }
}
