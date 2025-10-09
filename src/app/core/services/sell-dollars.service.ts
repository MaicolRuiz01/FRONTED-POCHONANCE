// src/app/core/services/sell-dollars.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { environment } from '../../../environment/environment';
import { map } from 'rxjs/operators';

export interface AssignAccount {
  amount: number;
  nameAccount: string;
  accountCop: number;
}

export interface SellDollar {
  id: number;
  idWithdrawals: string;
  tasa: number;
  dollars: number;
  nameAccount: string;
  date: Date;
  supplier?: number;
  pesos: number;
  accounts: AssignAccount[];
  clienteId?: number;
  nombresCuentasAsignadas?: string[];
  tipoCuenta?: string;
  cryptoSymbol?: string;
}

@Injectable({ providedIn: 'root' })
export class SellDollarsService {
  private readonly apiUrl = `${environment.apiUrl}/api/sell-dollars`;
  //payment
  private readonly apiVentasNoRegistradas = `${environment.apiUrl}/api/spot-orders/ventas-no-registradas`;
  //service spot
  private readonly apiVentasNoRegistradasBinancePay = `${environment.apiUrl}/api/ventas-no-registradas-binancepay`;
  //service de tron
  private readonly apiUsdtSalidas = `${environment.apiUrl}/api/usdt-salidas`;

  constructor(private http: HttpClient) { }

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

  getSellDto(): Observable<SellDollar[]> {
    return this.http.get<SellDollar[]>(`${this.apiUrl}/listar-dto`);
  }

  updateSellDollar(id: number, sell: SellDollar): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, sell);
  }

  importarVentasAutomaticamente(): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/importar-automatico`, {});
  }

  // obtiene las ventas que ya están guardadas en DB y NO asignadas (día actual)
  getNoAsignadas(): Observable<SellDollar[]> {
    return this.http.get<SellDollar[]>(`${this.apiUrl}/no-asignadas`);
  }

  // asigna una venta ya existente
  asignarVenta(id: number, dto: Partial<SellDollar>): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/asignar/${id}`, dto);
  }
  // En sell-dollars.service.ts
asignarVentaSolana(id: number, accounts: AssignAccount[]): Observable<any> {
  return this.http.put<any>(`${this.apiUrl}/asignar-solana/${id}`, { accounts });
}
}
