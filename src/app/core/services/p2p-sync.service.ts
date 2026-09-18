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
  estadoManual?: string; // lo sigue mandando el backend, pero ya no se usa (se quitaron los botones)
}

export interface PreAsignacionRequest {
  orderNumber: string;
  copId: number;
  accountBinance: string;
  /** Monto de la orden (miles). El backend lo guarda para sumar el verde/amarillo desde la BD. */
  pesosCop?: number;
}

/** Saldo de una cuenta COP para la vista de ventas en curso, calculado en el backend.
 *  verde = balance; amarillo (lo que se muestra) = balance + enCurso. */
export interface SaldoEnCurso {
  id: number;
  balance: number;
  cupoCajeroDisponibleHoy: number | null;
  cupoCorresponsalDisponibleHoy: number | null;
  /** Pesos (miles) de las ventas en curso pre-asignadas a la cuenta, aún no importadas. */
  enCurso: number;
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

  /** Saldo real + ventas en curso asignadas, por cuenta COP. */
  getSaldosEnCurso(): Observable<SaldoEnCurso[]> {
    return this.http.get<SaldoEnCurso[]>(`${this.activeUrl}/saldos-en-curso`);
  }

  savePreAsignacion(req: PreAsignacionRequest): Observable<any> {
    return this.http.post(`${this.activeUrl}/pre-asignacion`, req);
  }

  deletePreAsignacion(orderNumber: string): Observable<any> {
    return this.http.delete(`${this.activeUrl}/pre-asignacion/${orderNumber}`);
  }

  // ── Asignación automática (interruptor global) ───────────────

  /** Estado actual del interruptor de asignación automática. */
  getAutoAsignacion(): Observable<{ activa: boolean }> {
    return this.http.get<{ activa: boolean }>(`${this.activeUrl}/auto-asignacion`);
  }

  /** Prende/apaga la asignación automática de cuentas COP a las ventas en curso. */
  setAutoAsignacion(activa: boolean): Observable<{ activa: boolean }> {
    return this.http.put<{ activa: boolean }>(`${this.activeUrl}/auto-asignacion`, { activa });
  }
}
