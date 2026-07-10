import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { environment } from '../../../environment/environment';
import { AuthService } from './auth.service';

export interface SseEvent {
  tipo: string;
  cantidad?: number;
  hora?: string;
  mensaje?: string;
}

/**
 * SSE de eventos P2P (nuevas ventas / cambios de orden activa).
 *
 * Railway (proxy HTTP/2) a veces rompe las conexiones SSE (502 / ERR_HTTP2_PROTOCOL_ERROR).
 * Por eso: reconexión con BACKOFF y, tras varios fallos, se deja de intentar (para no inundar
 * la consola). La vista de ventas en curso ya tiene su propio auto-refresco cada pocos segundos,
 * así que sigue actualizándose aunque el SSE se rinda.
 */
@Injectable({ providedIn: 'root' })
export class P2PSseService implements OnDestroy {
  private eventSource: EventSource | null = null;
  private reconnectTimer?: ReturnType<typeof setTimeout>;

  private reconnectDelay = 2000;
  private readonly MAX_DELAY = 60000;
  private failCount = 0;
  private readonly MAX_SSE_ATTEMPTS = 4;
  private darsePorVencido = false;

  private nuevaVentaSubject        = new Subject<SseEvent>();
  private cambioOrdenActivaSubject = new Subject<SseEvent>();
  private connectedSubject         = new BehaviorSubject<boolean>(false);

  nuevaVenta$        = this.nuevaVentaSubject.asObservable();
  cambioOrdenActiva$ = this.cambioOrdenActivaSubject.asObservable();
  /** true cuando la conexión SSE está activa, false mientras reconecta / se rinde */
  connected$         = this.connectedSubject.asObservable();

  constructor(private zone: NgZone, private auth: AuthService) {}

  connect(): void {
    if (this.eventSource || this.darsePorVencido) return; // ya conectado o rendido

    const token = this.auth.getToken();
    const url = `${environment.apiUrl}/p2p-events/subscribe${token ? '?token=' + encodeURIComponent(token) : ''}`;
    this.eventSource = new EventSource(url);

    this.eventSource.addEventListener('connected', () => {
      this.zone.run(() => {
        this.connectedSubject.next(true);
        this.failCount = 0;
        this.reconnectDelay = 2000;
      });
    });

    this.eventSource.addEventListener('heartbeat', () => {
      // Solo mantiene la conexión viva — no hace nada en la UI
    });

    this.eventSource.addEventListener('nueva-venta-p2p', (event: MessageEvent) => {
      this.zone.run(() => {
        try {
          const data: SseEvent = JSON.parse(event.data);
          this.nuevaVentaSubject.next(data);
        } catch { /* ignorar */ }
      });
    });

    this.eventSource.addEventListener('cambio-orden-activa', (event: MessageEvent) => {
      this.zone.run(() => {
        try {
          const data: SseEvent = JSON.parse(event.data);
          this.cambioOrdenActivaSubject.next(data);
        } catch { /* ignorar */ }
      });
    });

    this.eventSource.onerror = () => {
      this.zone.run(() => {
        this.connectedSubject.next(false);
        this.closeEventSource();
        this.failCount++;

        if (this.failCount >= this.MAX_SSE_ATTEMPTS) {
          // Railway no está dejando el SSE → nos rendimos (la vista igual se auto-refresca sola).
          this.darsePorVencido = true;
          return;
        }

        // Reintento con backoff exponencial (tope 60s) en vez de cada 2s.
        this.reconnectTimer = setTimeout(() => this.connect(), this.reconnectDelay);
        this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.MAX_DELAY);
      });
    };
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
  }

  ngOnDestroy(): void {
    this.disconnect();
    this.nuevaVentaSubject.complete();
    this.cambioOrdenActivaSubject.complete();
    this.connectedSubject.complete();
  }
}
