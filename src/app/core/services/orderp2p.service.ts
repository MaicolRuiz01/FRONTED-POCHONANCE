import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpParams } from '@angular/common/http';

export interface OrderP2PDto {
  orderNumber: string;
  tradeType: string;
  amount: number;
  totalPrice: number;
  unitPrice: number;
  orderStatus: string;
  createTime: string;
  commission: number;
  counterPartNickName: string;
  payMethodName: string;
  nameAccount: string;
  accountAmount: number;

  binanceAccount: string;
}

@Injectable({
  providedIn: 'root',
})
export class OrderP2PService {
  private readonly baseUrl = 'http://localhost:8080/order-p2p';
  private readonly accounts = ['MILTON', 'SONIA', 'CESAR', 'MARCEL'];

  constructor(private http: HttpClient) {}

  getAllOrders(): Observable<OrderP2PDto[]> {
  const requests = this.accounts.map(account =>
    this.http.get<OrderP2PDto[]>(`${this.baseUrl}?account=${account}`).pipe(
      map(orders => orders.map(order => ({
        ...order,
        binanceAccount: account // aquí claramente asignado
      })))
    )
  );

  return forkJoin(requests).pipe(
    map(results => results.flat().sort((a, b) =>
      new Date(b.createTime).getTime() - new Date(a.createTime).getTime()
    ))
  );
}


  getOrdersByDateRange(account: string, from: Date, to: Date): Observable<OrderP2PDto[]> {
    const params = new HttpParams()
      .set('account', account)
      .set('fechaInicio', from.toISOString().slice(0,10))
      .set('fechaFin',    to.toISOString().slice(0,10));
    return this.http.get<OrderP2PDto[]>(`${this.baseUrl}/date-range`, { params });
  }
  getOrdersByDateRangeAllAccounts(from: Date, to: Date): Observable<OrderP2PDto[]> {
    const requests = this.accounts.map(account => {
      const params = new HttpParams()
        .set('account', account)
        .set('fechaInicio', from.toISOString().slice(0, 10))
        .set('fechaFin', to.toISOString().slice(0, 10));

      return this.http.get<OrderP2PDto[]>(`${this.baseUrl}/date-range`, { params }).pipe(
        map(orders => orders.map(order => ({
          ...order,
          binanceAccount: account
        })))
      );
    });

    return forkJoin(requests).pipe(
      map(results => results.flat().sort((a, b) =>
        new Date(b.createTime).getTime() - new Date(a.createTime).getTime()
      ))
    );
  }

}
