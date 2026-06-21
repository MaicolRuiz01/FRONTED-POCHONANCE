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

@Injectable({ providedIn: 'root' })
export class P2PSseService implements OnDestroy {
  private eventSource: EventSource | null = null;
  private reconnectTimer?: ReturnType<typeof setTimeout>;

  private nuevaVentaSubject        = new Subject<SseEvent>();
  private cambioOrdenActivaSubject = new Subject<SseEvent>();
  private connectedSubject         = new BehaviorSubject<boolean>(false);

  nuevaVenta$        = this.nuevaVentaSubject.asObservable();
  cambioOrdenActiva$ = this.cambioOrdenActivaSubject.asObservable();
  /** true cuando la conexión SSE está activa, false mientras reconecta */
  connected$         = this.connectedSubject.asObservable();

  constructor(private zone: NgZone, private auth: AuthService) {}

  connect(): void {
    if (this.eventSource) return; // ya conectado

    const token = this.auth.getToken();
    const url = `${environment.apiUrl}/p2p-events/subscribe${token ? '?token=' + encodeURIComponent(token) : ''}`;
    this.eventSource = new EventSource(url);

    this.eventSource.addEventListener('connected', () => {
      this.zone.run(() => this.connectedSubject.next(true));
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
        this.disconnect();
        // Reconectar en 2 s (antes eran 5 s)
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
    this.nuevaVentaSubject.complete();
    this.cambioOrdenActivaSubject.complete();
    this.connectedSubject.complete();
  }
}
