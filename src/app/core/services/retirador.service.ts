import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';

export type TipoRetiro = 'CAJERO' | 'CORRESPONSAL' | 'COMPLETO';
export type EstadoSolicitud = 'PENDIENTE' | 'COMPLETADO';

export interface Retirador {
  id?: number;
  nombre: string;
  efectivo?: { id: number; name: string; saldo: number };
  saldoPendiente?: number;
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
  retirador: Retirador;
  fechaCreacion: string;
  estado: EstadoSolicitud;
  totalMonto: number;
  pagoRetirador: number;
  detalles: DetalleRetiro[];
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

  crearSolicitud(req: SolicitudRetiroRequest): Observable<SolicitudRetiro> {
    return this.http.post<SolicitudRetiro>(`${this.base}/solicitar-retiro`, req);
  }

  confirmarSolicitud(solicitudId: number): Observable<SolicitudRetiro> {
    return this.http.post<SolicitudRetiro>(`${this.base}/solicitudes/${solicitudId}/confirmar`, {});
  }

  historial(retiradorId: number): Observable<SolicitudRetiro[]> {
    return this.http.get<SolicitudRetiro[]>(`${this.base}/${retiradorId}/solicitudes`);
  }

  pagar(retiradorId: number, req: PagoRetiradorRequest): Observable<Retirador> {
    return this.http.post<Retirador>(`${this.base}/${retiradorId}/pagar`, req);
  }
}
