// src/app/core/services/withdrawal.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';

export interface WithdrawalDto {
  id: string;
  amount: number;
  coin: string;
  completeTime: string;
  txId: string;
}

@Injectable({ providedIn: 'root' })
export class WithdrawalService {
  private readonly apiUrl = `${environment.apiUrl}/api/spot-orders/withdrawals`;

  constructor(private http: HttpClient) {}

  getWithdrawals(account: string, limit = 10000): Observable<WithdrawalDto[]> {
    return this.http.get<WithdrawalDto[]>(
      `${this.apiUrl}?account=${account}&limit=${limit}`
    );
  }
}
