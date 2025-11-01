import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';
import { SaleP2PDto } from './sale-p2p.service';
import { AccountBinance } from './account-binance.service';


export interface AccountCop {
  id?:number;
  name: string;
  balance: number;
}
export type AccountCopCreate = Omit<AccountCop, 'id'>;

@Injectable({
  providedIn: 'root'
})
export class AccountCopService {
   private apiUrl = `${environment.apiUrl}/cuenta-cop`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<AccountCop[]> {
    return this.http.get<AccountCop[]>(this.apiUrl);
  }

  create(account: AccountCopCreate): Observable<AccountCop> {
    if (!account.name || account.balance == null) {
      throw new Error('Name and balance cannot be null or empty');
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
getAllCajas(): Observable<{ id: number, name: string, saldo: number }[]> {
    return this.http.get<{ id: number, name: string, saldo: number }[]>(`${environment.apiUrl}/efectivo`);
}

}
