
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environment/environment';
import { Observable } from 'rxjs';

export interface Balance {
  id: number;
  date: string;
  usdt: number;
  pesos: number;
  deuda: number;
  gastos: number;
  saldo: number;
}

@Injectable({ providedIn: 'root' })
export class BalanceService {
  private readonly apiUrl = `${environment.apiUrl}/balance`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Balance[]> {
    return this.http.get<Balance[]>(this.apiUrl);
  }
}
