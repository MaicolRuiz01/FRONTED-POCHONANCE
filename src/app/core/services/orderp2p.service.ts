import { Injectable } from '@angular/core';


import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../../../environment/api-config';


@Injectable({
  providedIn: 'root'
})
export class Orderp2pService {

  constructor(private http: HttpClient) { }

  getP2POrders(account: string): Observable<any[]> {  // Usamos "any[]" para evitar la necesidad del DTO
    const params = new HttpParams().set('account', account);  // Añadimos el parámetro "account"
    return this.http.get<any[]>(`${API_CONFIG.baseUrl}/order-p2p`, { params });
  }
}
