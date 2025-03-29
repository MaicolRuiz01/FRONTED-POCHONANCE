import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { catchError, Observable, tap, throwError } from 'rxjs';
import { API_CONFIG } from '../../../environment/api-config';
import { SECONAPI_CONFIG } from '../../../environment/anotherapi-config';

@Injectable({
  providedIn: 'root'
})
export class P2pServiceService {
  private baseUrl = API_CONFIG.baseUrl;
  private baseUrl2 = SECONAPI_CONFIG.baseUrl;

  constructor(private http: HttpClient) { }

  getP2POrders(account: string): Observable<any> {
    const url = `${this.baseUrl}/p2p/orders`;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const params = new HttpParams().set('account', account);

    // Verifica si este log se imprime
    console.log(`Requesting P2P orders with URL: ${url}, Account: ${account}`);

    return this.http.get(url, { headers, params }).pipe(
      tap(data => console.log(`Received P2P orders:`, JSON.stringify(data))),
      catchError(error => {
        console.error(`Error fetching P2P orders:`, error);
        return throwError(() => new Error('Error fetching P2P orders'));
      })
    );
  }

   // Nuevo método para obtener órdenes por rango de fechas
   getOrdersByDateRange(account: string, fechaInicio: string, fechaFin: string): Observable<any> {
    const url = `${this.baseUrl2}/order-p2p/date-range`;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const params = new HttpParams()
      .set('account', account)
      .set('fechaInicio', fechaInicio)
      .set('fechaFin', fechaFin);

    console.log(`Sending request to ${url} with account: ${account}, fechaInicio: ${fechaInicio}, fechaFin: ${fechaFin}`);

    return this.http.get(url, { headers, params }).pipe(
      tap(response => console.log(`Response from date range API:`, JSON.stringify(response))),
      catchError(error => {
        console.error(`Error fetching orders by date range:`, error);
        return throwError(() => new Error('Error fetching orders by date range'));
      })
    );
  }

}
