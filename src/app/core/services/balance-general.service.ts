import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';

export interface BalanceGeneral {
  id: number;
  date: string;
  saldo: number;
  tasaPromedioDelDia: number;
  tasaVentaDelDia: number;
  totalP2PdelDia: number;
  comisionesP2PdelDia: number;
  cuatroPorMilDeVentas: number;
  utilidadP2P: number;
  totalVentasGeneralesDelDia: number;
  utilidadVentasGenerales: number;
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
