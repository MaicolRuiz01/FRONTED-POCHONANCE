import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';

/**
 * Deducción: venta P2P registrada a mano, para las órdenes que quedan en "modo restricción"
 * en Binance (el dinero cayó a una cuenta COP pero la orden nunca se completa).
 * Se guarda aparte de las ventas P2P, pero sí suma al saldo de la cuenta COP.
 */
export interface DeduccionDto {
  id?: number;

  accountBinanceId?: number | null;
  accountBinanceNombre?: string | null;

  accountCopId: number | null;
  accountCopNombre?: string | null;

  dollarsUs?: number | null;
  tasa?: number | null;
  pesosCop: number | null;

  fecha?: string;
  nota?: string | null;

  /** Solo al crear: evita duplicados si se hace doble clic en guardar. */
  idempotencyKey?: string;
}

@Injectable({ providedIn: 'root' })
export class DeduccionService {
  private apiUrl = `${environment.apiUrl}/deducciones`;

  constructor(private http: HttpClient) {}

  listar(): Observable<DeduccionDto[]> {
    return this.http.get<DeduccionDto[]>(this.apiUrl);
  }

  crear(dto: DeduccionDto): Observable<DeduccionDto> {
    return this.http.post<DeduccionDto>(this.apiUrl, dto);
  }

  actualizar(id: number, dto: DeduccionDto): Observable<DeduccionDto> {
    return this.http.put<DeduccionDto>(`${this.apiUrl}/${id}`, dto);
  }

  eliminar(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
