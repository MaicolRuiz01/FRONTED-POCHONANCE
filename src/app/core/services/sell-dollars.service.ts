// src/app/core/services/sell-dollars.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { environment } from '../../../environment/environment';
import { map } from 'rxjs/operators';

export interface SellDollar {
  idWithdrawals: string;
  tasa: number;
  dollars: number;
  nameAccount: string;
  date: Date;
  supplierId: number;
  pesos: number;
}

@Injectable({ providedIn: 'root' })
export class SellDollarsService {
  private readonly apiUrl = `${environment.apiUrl}/api/sell-dollars`;
  private readonly apiVentasNoRegistradas = `${environment.apiUrl}/api/spot-orders/ventas-no-registradas`;
  private readonly apiVentasNoRegistradasBinancePay = `${environment.apiUrl}/api/ventas-no-registradas-binancepay`;
  private readonly apiUsdtSalidas = `${environment.apiUrl}/api/usdt-salidas`;

  constructor(private http: HttpClient) {}

  createSellDollar(sell: SellDollar): Observable<any> {
    return this.http.post<any>(this.apiUrl, sell);
  }

  getAllUnregisteredSales(): Observable<SellDollar[]> {
    return forkJoin([
      this.http.get<SellDollar[]>(this.apiVentasNoRegistradas),
      this.http.get<SellDollar[]>(this.apiVentasNoRegistradasBinancePay),
      this.http.get<SellDollar[]>(this.apiUsdtSalidas)
    ]).pipe(
      map(([ventas, binancePay, usdtSalidas]) => [...ventas, ...binancePay, ...usdtSalidas])
    );
  }
}
