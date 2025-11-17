// src/app/core/services/ordenes-cripto.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';

export interface OrdenSpotDTO {
  id: number;
  idOrden: number;        // (=orderId de Binance)
  cuenta: string;         // nombre de la cuenta
  simbolo: string;        // TRXUSDT, BTCUSDT...
  lado: string;           // BUY / SELL
  estado: string;         // FILLED, CANCELED...
  precio: number;         // avgPrice
  cantidadBase: number;   // executedBaseQty
  cantidadQuote: number;  // executedQuoteQty
  comisionUsdt: number;   // feeTotalUsdt
  fecha: string;          // ISO (filledAt)
}

@Injectable({ providedIn: 'root' })
export class OrdenesCriptoService {
  private baseUrl = `${environment.apiUrl}/ordenes-spot`;

  constructor(private http: HttpClient) {}

  importarTodas(limite = 50): Observable<string> {
    const params = new HttpParams().set('limite', String(limite));
    return this.http.post(`${this.baseUrl}/importar/todas`, null, {
      params,
      responseType: 'text'
    });
  }

  // opcional: importar 1 cuenta con símbolos CSV
  importar(cuenta: string, simbolosCsv: string, limite = 50): Observable<string> {
    const params = new HttpParams()
      .set('cuenta', cuenta)
      .set('simbolosCsv', simbolosCsv)
      .set('limite', String(limite));
    return this.http.post(`${this.baseUrl}/importar`, null, { params, responseType: 'text' });
  }

  // listar (cuenta opcional)
  listar(cuenta?: string): Observable<OrdenSpotDTO[]> {
    let params = new HttpParams();
    if (cuenta && cuenta.trim()) params = params.set('cuenta', cuenta.trim());
    return this.http.get<OrdenSpotDTO[]>(`${this.baseUrl}/listar`, { params });
  }
}