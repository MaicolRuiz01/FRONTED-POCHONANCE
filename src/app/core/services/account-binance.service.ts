// src/app/core/services/account-binance.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';


export interface AccountBinance {
  id?: number;
  name: string;
  referenceAccount: string;
  correo: string;
  userBinance: string;
  balance: number;
  address: string;
}

@Injectable({
  providedIn: 'root'
})
export class AccountBinanceService {
  private apiUrl = `${environment.apiUrl}/cuenta-binance`;

  constructor(private http: HttpClient) {}

  traerCuentas(): Observable<AccountBinance[]> {
    return this.http.get<AccountBinance[]>(this.apiUrl); // Nota el array []
  }

  crear(account: AccountBinance): Observable<AccountBinance> {
    return this.http.post<AccountBinance>(this.apiUrl, account);
  }

  getUSDTBalanceBinance(name: string): Observable<string> {
  const url = `${this.apiUrl}/balance-usdt?name=${encodeURIComponent(name)}`;
  return this.http.get(url, { responseType: 'text' });
}
getTotalBalance(): Observable<number> {
  return this.http.get<number>(`${environment.apiUrl}/cuenta-binance/total-balance`);
}
getLatestPurchaseRate(): Observable<number> {
  return this.http.get<number>(`${environment.apiUrl}/tasa-promedio`);
}

getBalanceTotalInterno(): Observable<number> {
  return this.http.get<number>(`${environment.apiUrl}/cuenta-binance/total-balance-interno`);
}
}
