import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';

export interface SaleP2PDto {
  id: number;
  numberOrder: string;
  date: string;
  pesosCop: number;
  dollarsUs: number;
  commission: number;
  tasa?: number;
  asignado?: boolean;
  nameAccountBinance?: string;
  accountCopsDetails?: { nameAccount: string; amount: number }[];
  // formatted fields (added client-side)
  dateFmt?: string;
  pesosCopFmt?: string;
  dollarsUsFmt?: string;
  commissionFmt?: string;
  tasaFmt?: string;
}

@Injectable({ providedIn: 'root' })
export class SaleP2PService {
  private apiUrl = `${environment.apiUrl}/saleP2P`;

  constructor(private http: HttpClient) {}

  /** HOY no asignadas de 1 cuenta */
  getTodayNoAsignadas(account: string): Observable<SaleP2PDto[]> {
    return this.http.get<SaleP2PDto[]>(`${this.apiUrl}/today/no-asignadas?account=${encodeURIComponent(account)}`);
  }

  /** HOY no asignadas de TODAS las cuentas BINANCE */
  getTodayNoAsignadasAllAccounts(): Observable<SaleP2PDto[]> {
    return this.http.get<SaleP2PDto[]>(`${this.apiUrl}/today/no-asignadas/all-binance`);
  }

  /** Ventas asignadas entre fechas */
  getAsignadasByRange(inicio: string, fin: string): Observable<SaleP2PDto[]> {
    return this.http.get<SaleP2PDto[]>(`${this.apiUrl}/range?inicio=${inicio}&fin=${fin}`);
  }

  /** Todas las ventas de hoy (asignadas y no asignadas) */
  getTodayAll(): Observable<SaleP2PDto[]> {
    return this.http.get<SaleP2PDto[]>(`${this.apiUrl}/today`);
  }

  /** Asignación manual de cuentas COP a una venta */
  assignAccounts(
    saleId: number,
    accounts: { amount: number; nameAccount: string; accountCop: number | null }[]
  ): Observable<any> {
    return this.http.post(`${this.apiUrl}/assign-account-cop?saleId=${saleId}`, accounts, {
      responseType: 'text' as 'json'
    });
  }
}
