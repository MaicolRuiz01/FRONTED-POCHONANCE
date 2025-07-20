import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';

export interface BalanceGeneral {
  id: number;
  date: string;
  saldo: number;
  tasaCompra: number;
  tasaVenta: number;
  totalP2P: number;
  comisionesP2P: number;
  totalGeneralSales: number;
}

@Injectable({
  providedIn: 'root',
})
export class BalanceGeneralService {
  private readonly apiUrl =  `${environment.apiUrl}/balance-general`;

  constructor(private http: HttpClient) {}

  listar(): Observable<BalanceGeneral[]> {
    return this.http.get<BalanceGeneral[]>(`${this.apiUrl}/hoy`);
  }
}
