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
  tipo: string;
  apiKey?: string;
  apiSecret?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AccountBinanceService {
  private apiUrl = `${environment.apiUrl}/cuenta-binance`;

  constructor(private http: HttpClient) {}

  traerCuentas(): Observable<AccountBinance[]> {
    return this.http.get<AccountBinance[]>(this.apiUrl);
  }

  crear(account: AccountBinance): Observable<AccountBinance> {
    return this.http.post<AccountBinance>(this.apiUrl, account);
  }

  updateAccount(id: number, account: AccountBinance): Observable<AccountBinance> {
    return this.http.put<AccountBinance>(`${this.apiUrl}/${id}`, account);
  }

  // 🔹 nuevo método para buscar cuenta por id
  getById(id: number): Observable<AccountBinance> {
    return this.http.get<AccountBinance>(`${this.apiUrl}/${id}`);
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

  getBalanceTotalExterno(): Observable<number> {
    return this.http.get<number>(`${environment.apiUrl}/cuenta-binance/balance-total-externo`);
  }

  deleteAccount(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
  syncAllInternal(): Observable<string> {
    return this.http.post(`${this.apiUrl}/sync-internal/all`, {}, { responseType: 'text' });
  }
}
