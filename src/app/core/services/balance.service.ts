
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
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

export interface BalanceSaleP2PDto {
  Total: number ;
  vendidos: number ;
  tasaCompra: number ;
  tasaVenta: number ;
  ComisionUsdt: number;
  impuestosCol: number;
}


@Injectable({ providedIn: 'root' })
export class BalanceService {
  private readonly apiUrl = `${environment.apiUrl}/balance`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Balance[]> {
    return this.http.get<Balance[]>(this.apiUrl);
  }
    getBalanceSaleP2P(fecha: string): Observable<BalanceSaleP2PDto> {
    // fecha debe enviarse en formato 'yyyy-MM-dd'
    const params = new HttpParams().set('fecha', fecha);
    return this.http.get<BalanceSaleP2PDto>(this.apiUrl, { params });
  }


}
