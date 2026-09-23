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

  /**
   * TODAS las pendientes, sin filtrar por fecha.
   *
   * Es la misma consulta que usa el balance para la card "Asignar", así que lo que se ve en la
   * pestaña coincide con lo que la card está restando. Las de arriba solo traen las de hoy, y
   * una compra de ayer sin asignar quedaba restando sin aparecer en ninguna pantalla.
   */
  getNoAsignadasTodas(): Observable<BuyP2PDto[]> {
    return this.http.get<BuyP2PDto[]>(`${this.apiUrl}/no-asignadas`);
  }

  assignAccounts(
    buyId: number,
    accounts: { amount: number; nameAccount: string; accountCop: number | null }[]
  ): Observable<any> {
    const url = `${this.apiUrl}/assign-account-cop?buyId=${buyId}`;
    return this.http.post(url, accounts, { responseType: 'text' as 'json' });
  }
}
