import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { environment } from '../../../environment/environment';
import { AuthService } from './auth.service';

/**
 * SSE de la jornada del operador: recibe al instante los avisos de la vigilancia automática
 * (bájale un punto a la tasa) y las pausas del cronómetro.
 *
 * Mismo criterio que SaldosSseService: Railway rompe seguido las conexiones SSE, así que hay
 * reconexión con backoff y, tras varios fallos, se deja de insistir.
 *
 * A diferencia de saldos, acá el respaldo NO se hace en este servicio: el topbar consulta el
 * estado real por HTTP cada 30 s de todas formas. Así, aunque el SSE nunca conecte, el operador
 * se entera igual de que lo pausaron — solo que unos segundos más tarde. El estado de verdad
 * siempre vive en la BD, nunca en este canal.
 */
@Injectable({ providedIn: 'root' })
export class JornadaSseService implements OnDestroy {
  private eventSource: EventSource | null = null;
  private reconnectTimer?: ReturnType<typeof setTimeout>;

  private reconnectDelay = 2000;
  private readonly MAX_DELAY = 60000;
  private failCount = 0;
  private readonly MAX_SSE_ATTEMPTS = 4;
  private darsePorVencido = false;
  private username = '';

  /** Mensaje para mostrarle al operador. */
  private avisoSubject = new Subject<string>();
  aviso$ = this.avisoSubject.asObservable();

  /** Se detuvo el cronómetro; llega el motivo. */
  private pausaSubject = new Subject<string>();
  pausa$ = this.pausaSubject.asObservable();

  /** La jornada volvió a correr. */
  private reanudadaSubject = new Subject<void>();
  reanudada$ = this.reanudadaSubject.asObservable();

  constructor(private zone: NgZone, private auth: AuthService) {}

  connect(username: string): void {
    if (!username) return;
    this.username = username;
    if (this.eventSource || this.darsePorVencido) return;

    // El backend identifica al operador por el token, no por un parámetro: así nadie puede
    // suscribirse al canal de otro. El token va en la URL porque EventSource no manda cabeceras.
    const token = this.auth.getToken();
    const qs = token ? `?token=${encodeURIComponent(token)}` : '';

    this.eventSource = new EventSource(`${environment.apiUrl}/jornada-events/subscribe${qs}`);

    this.eventSource.onopen = () => {
      this.zone.run(() => {
        this.failCount = 0;
        this.reconnectDelay = 2000;
      });
    };

    this.eventSource.addEventListener('aviso', (e: MessageEvent) => {
      this.zone.run(() => {
        const msg = this.leerCampo(e, 'mensaje');
        if (msg) this.avisoSubject.next(msg);
      });
    });

    this.eventSource.addEventListener('pausa', (e: MessageEvent) => {
      this.zone.run(() => {
        const motivo = this.leerCampo(e, 'motivo') || 'Tu tiempo de trabajo se detuvo.';
        this.pausaSubject.next(motivo);
      });
    });

    this.eventSource.addEventListener('reanudada', () => {
      this.zone.run(() => this.reanudadaSubject.next());
    });

    this.eventSource.onerror = () => {
      this.zone.run(() => {
        this.closeEventSource();
        this.failCount++;

        if (this.failCount >= this.MAX_SSE_ATTEMPTS) {
          // Railway no está dejando el SSE. No pasa nada: el topbar igual consulta cada 30 s.
          this.darsePorVencido = true;
          return;
        }
        this.reconnectTimer = setTimeout(() => this.connect(this.username), this.reconnectDelay);
        this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.MAX_DELAY);
      });
    };
  }

  /** Lee un campo del JSON del evento sin reventar si viene malformado. */
  private leerCampo(e: MessageEvent, campo: string): string | null {
    try {
      const data = JSON.parse(e.data);
      return data?.[campo] ?? null;
    } catch {
      return null;
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
    this.darsePorVencido = false;
    this.failCount = 0;
  }

  ngOnDestroy(): void {
    this.disconnect();
    this.avisoSubject.complete();
    this.pausaSubject.complete();
    this.reanudadaSubject.complete();
  }
}
