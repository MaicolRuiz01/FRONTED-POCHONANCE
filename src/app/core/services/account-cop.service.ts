import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';
import { SaleP2PDto } from './sale-p2p.service';

export type BankTypeCop = 'NEQUI' | 'DAVIPLATA' | 'BANCOLOMBIA';

export interface AccountCop {
  id?: number;
  name: string;
  balance: number;

  // backend
  saldoInicialDelDia?: number;

  // solo UI / resumen
  entradasHoy?: number;
  salidasHoy?: number;
  ajustesHoy?: number;
  ventasDolaresHoy?: number;
  gastosHoy?: number;
  salidasRetirosHoy?: number;
  isFlipped?: boolean;

  // ✅ nuevo
  bankType: BankTypeCop;
}

/**
 * ✅ SOLO lo que el backend necesita para crear.
 * Nada de entradasHoy, isFlipped, etc.
 */
export interface AccountCopCreate {
  name: string;
  balance: number;
  bankType: BankTypeCop;
}

@Injectable({ providedIn: 'root' })
export class AccountCopService {
  private apiUrl = `${environment.apiUrl}/cuenta-cop`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<AccountCop[]> {
    return this.http.get<AccountCop[]>(this.apiUrl);
  }

  create(account: AccountCopCreate): Observable<AccountCop> {
    if (!account.name?.trim()) {
      throw new Error('Name cannot be empty');
    }
    if (account.balance == null) {
      throw new Error('Balance cannot be null');
    }
    if (!account.bankType) {
      throw new Error('BankType is required');
    }
    return this.http.post<AccountCop>(this.apiUrl, account);
  }

  getSalesByAccountCopId(accountCopId: number): Observable<SaleP2PDto[]> {
    const url = `${this.apiUrl}/pagos-cuenta/${accountCopId}`;
    return this.http.get<SaleP2PDto[]>(url);
  }

  getTotalBalance(): Observable<number> {
    return this.http.get<number>(`${environment.apiUrl}/cuenta-binance/total-balance`);
  }

  getAllCajas(): Observable<{ id: number; name: string; saldo: number }[]> {
    return this.http.get<{ id: number; name: string; saldo: number }[]>(`${environment.apiUrl}/efectivo`);
  }

  getById(id: number): Observable<AccountCop> {
    return this.http.get<AccountCop>(`${this.apiUrl}/${id}`);
  }
}
