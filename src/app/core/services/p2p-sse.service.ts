import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { environment } from '../../../environment/environment';

export interface SseEvent {
  tipo: string;
  cantidad?: number;
  hora?: string;
  mensaje?: string;
}

@Injectable({ providedIn: 'root' })
export class P2PSseService implements OnDestroy {
  private eventSource: EventSource | null = null;
  private nuevaVentaSubject = new Subject<SseEvent>();

  nuevaVenta$ = this.nuevaVentaSubject.asObservable();

  constructor(private zone: NgZone) {}

  connect(): void {
    if (this.eventSource) return; // ya conectado

    const url = `${environment.apiUrl}/p2p-events/subscribe`;
    this.eventSource = new EventSource(url);

    this.eventSource.addEventListener('nueva-venta-p2p', (event: MessageEvent) => {
      this.zone.run(() => {
        try {
          const data: SseEvent = JSON.parse(event.data);
          this.nuevaVentaSubject.next(data);
        } catch {
          // ignorar datos malformados
        }
      });
    });

    this.eventSource.onerror = () => {
      // reconectar en 5 segundos si se cae
      this.disconnect();
      setTimeout(() => this.connect(), 5000);
    };
  }

  disconnect(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  ngOnDestroy(): void {
    this.disconnect();
    this.nuevaVentaSubject.complete();
  }
}
