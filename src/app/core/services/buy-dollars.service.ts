import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environment/environment';

export interface BuyDollarsDto {
  dollars: number;
  tasa: number;
  nameAccount: string;
  date: Date;
  supplierId: number;
  idDeposit: string;
  pesos: number;
}

@Injectable({
  providedIn: 'root'
})
export class BuyDollarsService {
  private readonly apiCompra = `${environment.apiUrl}/api/buy-dollars`;
  private readonly apiUrl = `${environment.apiUrl}/api/buy-dollars`;

  constructor(private http: HttpClient) {}

  /** Crea una compra de dólares en el backend */
  createBuyDollar(buyData: BuyDollarsDto): Observable<any> {
    return this.http.post<any>(this.apiCompra, buyData);
  }

  /** Obtiene todas las entradas no registradas (spot, binancepay y tron) */
  getAllEntradas(): Observable<BuyDollarsDto[]> {
    const binance$ = this.http.get<BuyDollarsDto[]>(`${environment.apiUrl}/api/compras-binancepay`);
    const spot$ = this.http.get<BuyDollarsDto[]>(`${environment.apiUrl}/api/spot-orders/compras-no-registradas`);
    const usdt$ = this.http.get<BuyDollarsDto[]>(`${environment.apiUrl}/api/usdt-entradas`);

    return forkJoin([binance$, spot$, usdt$]).pipe(
      map(([binance, spot, usdt]) => [...binance, ...spot, ...usdt])
    );
  }
}
