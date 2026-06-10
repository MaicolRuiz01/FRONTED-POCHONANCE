import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';

export interface BuyP2PDto {
  id: number;
  numberOrder: string;
  date: Date;
  pesosCop: number;
  dollarsUs: number;
  commission: number;
  tasa: number;
  nameAccountBinance: string;
  asignado: boolean;
}

@Injectable({ providedIn: 'root' })
export class BuyP2PService {
  private apiUrl = `${environment.apiUrl}/buyP2P`;

  constructor(private http: HttpClient) {}

  getTodayNoAsignadas(account: string): Observable<BuyP2PDto[]> {
    return this.http.get<BuyP2PDto[]>(`${this.apiUrl}/today/no-asignadas?account=${account}`);
  }

  getTodayNoAsignadasAllAccounts(): Observable<BuyP2PDto[]> {
    return this.http.get<BuyP2PDto[]>(`${this.apiUrl}/today/no-asignadas/all-binance`);
  }

  assignAccounts(
    buyId: number,
    accounts: { amount: number; nameAccount: string; accountCop: number | null }[]
  ): Observable<any> {
    const url = `${this.apiUrl}/assign-account-cop?buyId=${buyId}`;
    return this.http.post(url, accounts, { responseType: 'text' as 'json' });
  }
}
