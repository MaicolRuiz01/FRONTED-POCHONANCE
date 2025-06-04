import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpParams } from '@angular/common/http';
import { environment } from '../../../environment/environment';
import { SaleP2PDto } from './sale-p2p.service';

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
  private readonly apiUrl = `${environment.apiUrl}/order-p2p`;

  constructor(private http: HttpClient) {}

   getOrdersByDateRange(account: string, from: Date, to: Date): Observable<OrderP2PDto[]> {
    const params = new HttpParams()
      .set('account', account)
      .set('fechaInicio', from.toISOString().slice(0, 10))
      .set('fechaFin', to.toISOString().slice(0, 10));

    return this.http.get<OrderP2PDto[]>(`${this.apiUrl}/date-range`, { params }).pipe(
      map(orders => orders.map(order => ({
        ...order,
        binanceAccount: account
      })))
    );
  }

    getTodaySales(accountName: string): Observable<SaleP2PDto[]> {
    const params = new HttpParams().set('account', accountName);
    return this.http.get<SaleP2PDto[]>(`${this.apiUrl}/saleP2P/today`, { params });
  }


}
