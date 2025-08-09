import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environment/environment';

export interface BuyDollarsDto {
  id?: number;
  dollars: number;
  tasa: number;
  nameAccount: string;
  date: Date;
  supplierId: number;
  supplierName?: string;
  idDeposit: string;
  pesos: number;
}

@Injectable({
  providedIn: 'root'
})
export class BuyDollarsService {
  private readonly apiCompra = `${environment.apiUrl}/api/buy-dollars`;
  private readonly apiUrl = `${environment.apiUrl}/api/buy-dollars`;

  constructor(private http: HttpClient) {}

  /** Crea una compra de dólares en el backend */
  createBuyDollar(buyData: BuyDollarsDto): Observable<any> {
    return this.http.post<any>(this.apiCompra, buyData);
  }

  /** Obtiene todas las entradas no registradas (spot, binancepay y tron) */
  getAllEntradas(): Observable<BuyDollarsDto[]> {
    const binance$ = this.http.get<BuyDollarsDto[]>(`${environment.apiUrl}/api/compras-binancepay`);
    const spot$ = this.http.get<BuyDollarsDto[]>(`${environment.apiUrl}/api/spot-orders/compras-no-registradas`);
    const usdt$ = this.http.get<BuyDollarsDto[]>(`${environment.apiUrl}/api/usdt-entradas`);

    return forkJoin([binance$, spot$, usdt$]).pipe(
      map(([binance, spot, usdt]) => [...binance, ...spot, ...usdt])
    );
  }

  getComprasRegistradas(): Observable<BuyDollarsDto[]> {
  return this.http.get<BuyDollarsDto[]>(`${environment.apiUrl}/api/buy-dollars/listado`);
}

updateBuyDollar(id: number, dto: BuyDollarsDto): Observable<any> {
  return this.http.put<any>(`${this.apiUrl}/${id}`, dto);
}

/** Obtiene las compras no asignadas del día */
getComprasNoAsignadasHoy(): Observable<BuyDollarsDto[]> {
  return this.http.get<BuyDollarsDto[]>(`${this.apiUrl}/no-asignadas-hoy`);
}

/** Asigna una compra existente (asignar proveedor + tasa) */
asignarCompra(id: number, dto: Partial<BuyDollarsDto>): Observable<any> {
  return this.http.put(`${this.apiUrl}/asignar/${id}`, dto);
}
importarComprasAutomaticamente(): Observable<void> {
  return this.http.post<void>(`${this.apiUrl}/importar-automatico`, {});
}

}
