import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';

export type TipoRetiro = 'CAJERO' | 'CORRESPONSAL' | 'COMPLETO';
export type EstadoSolicitud = 'SIN_ASIGNAR' | 'PENDIENTE' | 'COMPLETADO';

export interface Retirador {
  id?: number;
  nombre: string;
  efectivo?: { id: number; name: string; saldo: number };
  saldoPendiente?: number;
  telegramUsername?: string;
}

export interface DetalleRetiroDto {
  cuentaCopId: number;
  tipoRetiro: TipoRetiro;
  montoCajero?: number | null;
  montoCorresponsal?: number | null;
}

export interface SolicitudRetiroRequest {
  retiradorId: number;
  detalles: DetalleRetiroDto[];
}

export interface SolicitudGeneralRequest {
  detalles: DetalleRetiroDto[];
}

export interface AsignarRetiradorRequest {
  retiradorId: number;
  telegramUsername?: string;
}

export type FuentePago = 'COP' | 'CAJA';

export interface PagoRetiradorRequest {
  fuente: FuentePago;
  cuentaCopId?: number | null;
  cajaId?: number | null;
  monto: number;
}

export interface DetalleRetiro {
  id: number;
  cuentaCop: { id: number; name: string; bankType: string };
  tipoRetiro: TipoRetiro;
  montoCajero?: number;
  montoCorresponsal?: number;
}

export interface SolicitudRetiro {
  id: number;
  retirador: Retirador | null;
  fechaCreacion: string;
  estado: EstadoSolicitud;
  totalMonto: number;
  pagoRetirador: number;
  detalles: DetalleRetiro[];
}

export interface RankingRetirador {
  retiradorId: number;
  nombre: string;
  totalRetirado: number;
  posicion: number;
}

@Injectable({ providedIn: 'root' })
export class RetiradorService {
  private base = `${environment.apiUrl}/retiradores`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Retirador[]> {
    return this.http.get<Retirador[]>(this.base);
  }

  create(r: Retirador): Observable<Retirador> {
    return this.http.post<Retirador>(this.base, r);
  }

  update(id: number, r: Partial<Retirador>): Observable<Retirador> {
    return this.http.put<Retirador>(`${this.base}/${id}`, r);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  // ── Solicitud con retirador pre-asignado ──────────────────────

  crearSolicitud(req: SolicitudRetiroRequest): Observable<SolicitudRetiro> {
    return this.http.post<SolicitudRetiro>(`${this.base}/solicitar-retiro`, req);
  }

  confirmarSolicitud(solicitudId: number): Observable<SolicitudRetiro> {
    return this.http.post<SolicitudRetiro>(`${this.base}/solicitudes/${solicitudId}/confirmar`, {});
  }

  historial(retiradorId: number): Observable<SolicitudRetiro[]> {
    return this.http.get<SolicitudRetiro[]>(`${this.base}/${retiradorId}/solicitudes`);
  }

  // ── Solicitud general (sin retirador) ─────────────────────────

  crearSolicitudGeneral(req: SolicitudGeneralRequest): Observable<SolicitudRetiro> {
    return this.http.post<SolicitudRetiro>(`${this.base}/solicitud-general`, req);
  }

  getSolicitudesSinAsignar(): Observable<SolicitudRetiro[]> {
    return this.http.get<SolicitudRetiro[]>(`${this.base}/solicitud-general/pendientes`);
  }

  asignarRetirador(solicitudId: number, req: AsignarRetiradorRequest): Observable<SolicitudRetiro> {
    return this.http.post<SolicitudRetiro>(`${this.base}/solicitud-general/${solicitudId}/asignar`, req);
  }

  // ── Pago ──────────────────────────────────────────────────────

  pagar(retiradorId: number, req: PagoRetiradorRequest): Observable<Retirador> {
    return this.http.post<Retirador>(`${this.base}/${retiradorId}/pagar`, req);
  }

  // ── Ranking semanal ───────────────────────────────────────────

  getRankingSemana(): Observable<RankingRetirador[]> {
    return this.http.get<RankingRetirador[]>(`${this.base}/ranking/semana`);
  }
}
