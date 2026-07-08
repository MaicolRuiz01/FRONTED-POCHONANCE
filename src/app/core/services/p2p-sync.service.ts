import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';

export interface SyncResult {
  nuevasVentas: number;
  mensaje: string;
}

export interface P2PSyncState {
  id: number;
  binanceAccountName: string;
  lastSyncAtMs: number;
  lastSyncTime: string;
}

export interface ActiveP2POrder {
  orderNumber: string;
  status: string;
  statusLabel: string;
  accountBinance: string;
  dollarsUs: number;
  pesosCop: number;
  tasa: number;
  createTime: string;
  preAsignadoCopId: number | null;
  preAsignadoCopNombre: string | null;
  estadoManual?: string; // 'PENDIENTE' (amarillo) | 'RECIBIDO' (verde)
}

export interface PreAsignacionRequest {
  orderNumber: string;
  copId: number;
  accountBinance: string;
}

@Injectable({ providedIn: 'root' })
export class P2PSyncService {
  private apiUrl    = `${environment.apiUrl}/p2p-sync`;
  private activeUrl = `${environment.apiUrl}/api/p2p`;

  constructor(private http: HttpClient) {}

  triggerSync(): Observable<SyncResult> {
    return this.http.post<SyncResult>(`${this.apiUrl}/trigger`, {});
  }

  getSyncStatus(): Observable<P2PSyncState[]> {
    return this.http.get<P2PSyncState[]>(`${this.apiUrl}/status`);
  }

  // ── Órdenes activas ──────────────────────────────────────────

  getActiveOrders(): Observable<ActiveP2POrder[]> {
    return this.http.get<ActiveP2POrder[]>(`${this.activeUrl}/active-orders`);
  }

  savePreAsignacion(req: PreAsignacionRequest): Observable<any> {
    return this.http.post(`${this.activeUrl}/pre-asignacion`, req);
  }

  deletePreAsignacion(orderNumber: string): Observable<any> {
    return this.http.delete(`${this.activeUrl}/pre-asignacion/${orderNumber}`);
  }

  /** Clasifica el dinero de la orden: 'RECIBIDO' (verde) o 'PENDIENTE' (amarillo). */
  setEstadoManual(orderNumber: string, estado: 'RECIBIDO' | 'PENDIENTE'): Observable<any> {
    return this.http.put(`${this.activeUrl}/pre-asignacion/${orderNumber}/estado`, {}, { params: { estado } });
  }
}
