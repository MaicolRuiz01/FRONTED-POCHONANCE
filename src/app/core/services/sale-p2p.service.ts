import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';

export interface SaleP2PDto {
  id: number;
  numberOrder: string;
  date: string;          // normalmente llega como string ISO
  pesosCop: number;
  dollarsUs: number;
  commission: number;
  nameAccountBinance?: string;
  // si lo agregaste en backend:
  // asignado?: boolean;
}

@Injectable({ providedIn: 'root' })
export class SaleP2PService {
  private apiUrl = `${environment.apiUrl}/saleP2P`;

  constructor(private http: HttpClient) {}

  /** ✅ HOY no asignadas de 1 cuenta (importa+guarda y lista no asignadas) */
  getTodayNoAsignadas(account: string): Observable<SaleP2PDto[]> {
    const url = `${this.apiUrl}/today/no-asignadas?account=${encodeURIComponent(account)}`;
    return this.http.get<SaleP2PDto[]>(url);
  }

  /** ✅ HOY no asignadas de TODAS las cuentas BINANCE */
  getTodayNoAsignadasAllAccounts(): Observable<SaleP2PDto[]> {
    const url = `${this.apiUrl}/today/no-asignadas/all-binance`;
    return this.http.get<SaleP2PDto[]>(url);
  }

  /** asignación igual que antes */
  assignAccounts(
    saleId: number,
    accounts: { amount: number; nameAccount: string; accountCop: number | null }[]
  ): Observable<any> {
    const url = `${this.apiUrl}/assign-account-cop?saleId=${saleId}`;
    return this.http.post(url, accounts, { responseType: 'text' as 'json' });
  }
}

