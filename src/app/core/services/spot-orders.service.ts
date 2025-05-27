// src/app/core/services/spot-orders.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';

export interface SellDollarsDto {
  idWithdrawals: string;
  tasa: number | null;
  dollars: number;
  pesos: number | null;
  date: string;  // o Date si prefieres, luego parseas
  nameAccount: string;
  accountBinanceId: number | null;
  equivalenteciaTRX: number | null;
}

//este service es para obtener las compras trx que luego se envian al proveedor para luego converitlo en un selldolars
@Injectable({ providedIn: 'root' })
export class SpotOrdersService {
  private readonly apiUrl = `${environment.apiUrl}/api/spot-orders/trades`;

  constructor(private http: HttpClient) {}

  getTrades(): Observable<SellDollarsDto[]> {
    return this.http.get<SellDollarsDto[]>(this.apiUrl);
  }
}
