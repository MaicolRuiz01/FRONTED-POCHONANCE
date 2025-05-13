import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';

export interface Deposit {
  /* id: string;
  amount: number;
  transactionFee: string;
  coin: string;
  status: number;
  address: string;
  txId: string;
  applyTime: string;
  network: string;
  transferType: number;
  walletType: number;
  completeTime: string; */

  dollars: number;
  tasa: number;
  nameAccount: string;
  date: string;
  idDeposit: string;
  pesos: number;
  accountBinanceId: null;


  
}

@Injectable({
  providedIn: 'root',
})
export class DepositService {
  private readonly apiUrl = `${environment.apiUrl}/api/transactions`;  // URL de la API que devuelve los depósitos

  constructor(private http: HttpClient) {}

  // Método para obtener todos los depósitos
  getDeposits(account: string): Observable<Deposit[]> {
    return this.http.get<Deposit[]>(`${this.apiUrl}?account=${account}`);
  }
}
