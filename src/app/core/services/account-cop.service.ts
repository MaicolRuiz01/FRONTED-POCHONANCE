import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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
  private readonly url = 'http://localhost:8080/cuenta-cop';

  constructor(private http: HttpClient) {}

  getAll(): Observable<AccountCop[]> {
    return this.http.get<AccountCop[]>(this.url);
  }

  create(account: AccountCopCreate): Observable<AccountCop> {
    if (!account.name || account.balance == null) {
      throw new Error('Name and balance cannot be null or empty');
    }
    return this.http.post<AccountCop>(this.url, account);
  }
}
