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
 * la consola) y se vuelve a intentar cada minuto. Antes se rendía para siempre: bastaba un corte de Railway
 * para que la pantalla quedara sin avisos en vivo hasta recargar la página. La vista de ventas en curso
 * tiene además su propio auto-refresco, que cubre los ratos sin conexión.
 */
@Injectable({ providedIn: 'root' })
export class P2PSseService implements OnDestroy {
  private eventSource: EventSource | null = null;
  private reconnectTimer?: ReturnType<typeof setTimeout>;

  private reconnectDelay = 2000;
  private readonly MAX_DELAY = 60000;
  private failCount = 0;
  private readonly MAX_SSE_ATTEMPTS = 4;
  /** Cada cuánto se reintenta la conexión después de rendirse (ms). */
  private readonly REINTENTO_LARGO_MS = 60000;

  private nuevaVentaSubject        = new Subject<SseEvent>();
  private cambioOrdenActivaSubject = new Subject<SseEvent>();
  private cuentasCambiaronSubject  = new Subject<SseEvent>();
  private chatEnvioSubject         = new Subject<SseEvent>();
  private connectedSubject         = new BehaviorSubject<boolean>(false);

  nuevaVenta$        = this.nuevaVentaSubject.asObservable();
  cambioOrdenActiva$ = this.cambioOrdenActivaSubject.asObservable();
  /** Una cuenta COP se activó o se desactivó para P2P (la lista de cuentas hay que recargarla). */
  cuentasCambiaron$  = this.cuentasCambiaronSubject.asObservable();
  /** Terminó un envío automático de la cuenta por el chat: hay que refrescar el estado "Enviando… / Enviada". */
  chatEnvio$         = this.chatEnvioSubject.asObservable();
  /** true cuando la conexión SSE está activa, false mientras reconecta / se rinde */
  connected$         = this.connectedSubject.asObservable();

  constructor(private zone: NgZone, private auth: AuthService) {}

  connect(): void {
    if (this.eventSource) return; // ya conectado

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

    this.eventSource.addEventListener('cuentas-p2p-cambiaron', (event: MessageEvent) => {
      this.zone.run(() => {
        try {
          this.cuentasCambiaronSubject.next(JSON.parse(event.data));
        } catch { /* ignorar */ }
      });
    });

    this.eventSource.addEventListener('chat-envio-actualizado', (event: MessageEvent) => {
      this.zone.run(() => {
        try {
          this.chatEnvioSubject.next(JSON.parse(event.data));
        } catch { /* ignorar */ }
      });
    });

    this.eventSource.onerror = () => {
      this.zone.run(() => {
        this.connectedSubject.next(false);
        this.closeEventSource();
        this.failCount++;

        if (this.failCount >= this.MAX_SSE_ATTEMPTS) {
          // Railway no está dejando el SSE: se pausa y se vuelve a intentar en un minuto
          // (la vista igual se auto-refresca sola mientras tanto).
          this.failCount = 0;
          this.reconnectDelay = 2000;
          this.reconnectTimer = setTimeout(() => this.connect(), this.REINTENTO_LARGO_MS);
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
    this.cuentasCambiaronSubject.complete();
    this.chatEnvioSubject.complete();
    this.connectedSubject.complete();
  }
}
