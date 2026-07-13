// src/app/services/traspasos.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { environment } from '../../../environment/environment';
import { map } from 'rxjs/operators';


export interface TransaccionesDTO {
  monto: number;
  idtransaccion: string;
  cuentaTo: string;
  cuentaFrom: string;
  fecha: string; // o Date si prefieres
  tipo: string;
}

/** Fila liviana del listado de traspasos (de, a, fecha, cantidad, moneda). */
export interface TraspasoItem {
  fecha: string;
  cantidad: number;
  moneda: string;
  deQuien: string;
  aQuien: string;
  idtransaccion: string;
}

/** Respuesta paginada estándar de Spring Data (Page). */
export interface PageResp<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

@Injectable({
  providedIn: 'root',
})
export class TraspasosService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getTrustTransaccionesSalientes(): Observable<TransaccionesDTO[]> {
    return this.http.get<TransaccionesDTO[]>(`${this.baseUrl}/api/trust-transacciones-salientes`);
  }

  getTraspasosNoRegistrados(): Observable<TransaccionesDTO[]> {
    return this.http.get<TransaccionesDTO[]>(`${this.baseUrl}/api/spot-orders/traspasos-no-registrados`);
  }
  //esta bien
  getTransaccionesBinancePay(): Observable<TransaccionesDTO[]> {
    return this.http.get<TransaccionesDTO[]>(`${this.baseUrl}/api/transacciones-binacepay`);
  }

  guardarTransaccion(dto: TransaccionesDTO): Observable<any> {
    return this.http.post(`${this.baseUrl}/transacciones/guardar`, dto);
  }

  obtenerTodosLosTraspasos(): Observable<TransaccionesDTO[]> {
    return forkJoin([
      this.getTrustTransaccionesSalientes(),
      this.getTraspasosNoRegistrados(),
      this.getTransaccionesBinancePay(),
    ]).pipe(
      map(([trust, noRegistrados, binancePay]) => [...trust, ...noRegistrados, ...binancePay])
    );
  }

    getTransaccionesDeHoy(): Observable<TransaccionesDTO[]> {
    return this.http.get<TransaccionesDTO[]>(`${this.baseUrl}/transacciones/hoy`);
  }

  /** Listado paginado y liviano de TODOS los traspasos (para el tab Asignar → Traspasos). */
  getTraspasosPaginados(page: number, size: number): Observable<PageResp<TraspasoItem>> {
    const params = new HttpParams()
      .set('page', String(page))
      .set('size', String(size));
    return this.http.get<PageResp<TraspasoItem>>(`${this.baseUrl}/transacciones/listado`, { params });
  }
}
