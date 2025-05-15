import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';

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
}
