import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';

export interface BuyDollarsDto {
  dollars: number;
  tasa: number;
  nameAccount: string;
  date: Date;
  supplierId: number;
  idDeposit:string;
  pesos: number;
}


@Injectable({
  providedIn: 'root'
})
export class BuyDollarsService {
  private apiUrl = `${environment.apiUrl}/buy-dollars`;  // URL del endpoint en el backend

  constructor(private http: HttpClient) { }

  /** Crea un registro de compra de dólares enviándolo al backend */
  createBuyDollar(buyData: BuyDollarsDto): Observable<any> {
    // Realizar la petición HTTP POST para crear la compra
    return this.http.post<any>(this.apiUrl, buyData);
  }
}
