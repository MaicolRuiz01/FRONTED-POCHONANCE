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
  clientesSaldo: number;
  saldoCajas: number;
  comisionTrust: number;
  saldoCuentasBinance: number;
  proveedores: number;
  cuentasCop: number
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

totalCaja(): Observable<Record<string, number>> {
  return this.http.get<Record<string, number>>(`${this.apiUrl}/cajas/total`);
}

totalClientes(): Observable<number> {
  return this.http.get<number>(`${this.apiUrl}/clientes/total`);
}

}
