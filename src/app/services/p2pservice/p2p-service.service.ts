import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { catchError, Observable, tap, throwError } from 'rxjs';
import { API_CONFIG } from '../../config/api-config';

@Injectable({
  providedIn: 'root'
})
export class P2pServiceService {
  private baseUrl = API_CONFIG.baseUrl;

  constructor(private http: HttpClient) { }

  getP2POrders(account: string, fechaInicio: string, fechaFin: string): Observable<any> {
    // Adjusted URL to include the date range parameters
    const url = `${this.baseUrl}/order-p2p/date-range`;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    
    // Updated params to include all required query parameters
    const params = new HttpParams()
      .set('account', account)
      .set('fechaInicio', fechaInicio)
      .set('fechaFin', fechaFin);

    console.log(`Requesting P2P orders with URL: ${url}, Account: ${account}, Start Date: ${fechaInicio}, End Date: ${fechaFin}`);

    return this.http.get(url, { headers, params }).pipe(
      tap(data => console.log(`Received P2P orders:`, JSON.stringify(data))),
      catchError(error => {
        console.error(`Error fetching P2P orders:`, error);
        return throwError(() => new Error('Error fetching P2P orders'));
      })
    );
  }
  
  getP2POrdersTodos(account: string): Observable<any> {
    const url = `${this.baseUrl}/order-p2p`;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    
    // Updated params to include all required query parameters
    const params = new HttpParams()
      .set('account', account);

    console.log(`Requesting P2P orders with URL: ${url}, Account: ${account}`);

    return this.http.get(url, { headers, params }).pipe(
      tap(data => console.log(`Received P2P orders:`, JSON.stringify(data))),
      catchError(error => {
        console.error(`Error fetching P2P orders:`, error);
        return throwError(() => new Error('Error fetching P2P orders'));
      })
    );
}
}
