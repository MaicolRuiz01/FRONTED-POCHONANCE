import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SaleP2PDto {
  numberOrder: string;
  date: Date;
  taxType: string;
  pesosCop: number;
  accountCopIds: number[];
  nameAccount: string;
  nameAccountBinance: string;
  accountAmounts: { [key: number]: number }; // Nuevo campo para montos por cuenta
}

@Injectable({
  providedIn: 'root'
})
export class SaleP2PService {
  private readonly api = 'http://localhost:8080/saleP2P';

  constructor(private http: HttpClient) {}

  createSale(saleDto: SaleP2PDto): Observable<SaleP2PDto> {
    return this.http.post<SaleP2PDto>(this.api, saleDto);
  }
}