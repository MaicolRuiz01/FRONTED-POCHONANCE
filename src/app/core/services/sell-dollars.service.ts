// src/app/core/services/sell-dollars.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';

export interface SellDollar {
  idWithdrawals: string;
  tasa: number;
  dollars: number;
  nameAccount: string;
  date: Date;
  supplierId: number;
}

@Injectable({ providedIn: 'root' })
export class SellDollarsService {
  private readonly apiUrl = `${environment.apiUrl}/api/sell-dollars`;

  constructor(private http: HttpClient) {}

  createSellDollar(sell: SellDollar): Observable<any> {
    return this.http.post<any>(this.apiUrl, sell);
  }
}
