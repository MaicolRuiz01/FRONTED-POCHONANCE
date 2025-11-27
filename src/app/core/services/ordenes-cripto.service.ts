import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';

export interface OrdenSpotDTO {
  id: number;
  idOrdenBinance: number; // = idOrdenBinance en la entidad
  cuenta: string;         // nombre de la cuenta Binance
  simbolo: string;        // BTCUSDT, TRXUSDT...
  cripto: string;         // BTC, TRX, SOL...
  tipoOperacion: string;  // COMPRA / VENTA
  cantidadCripto: number; // unidades de cripto
  tasaUsdt: number;       // precio unitario USDT
  totalUsdt: number;      // total USDT
  comisionUsdt: number;   // comisión total USDT
  fechaOperacion: string; // ISO
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