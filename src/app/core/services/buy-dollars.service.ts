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
  private apiUrl = `${environment.apiUrl}/api/buy-dollars`;  // URL del endpoint en el backend
  private apiTrustUrl = `${environment.apiUrl}/api/trx-entradas`;

  constructor(private http: HttpClient) { }

  /** Crea un registro de compra de dólares enviándolo al backend */
  createBuyDollar(buyData: BuyDollarsDto): Observable<any> {
    // Realizar la petición HTTP POST para crear la compra
    return this.http.post<any>(this.apiUrl, buyData);
  }

  /** Obtiene las transacciones TRUST (entradas) desde backend */
  getTrustTransactions(): Observable<BuyDollarsDto[]> {
    return this.http.get<BuyDollarsDto[]>(this.apiTrustUrl);
  }
}
