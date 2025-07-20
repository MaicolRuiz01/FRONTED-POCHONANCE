import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';

export interface SaleP2PDto {
  id: number;
  numberOrder: string;
  date: Date;
  taxType: string;
  pesosCop: number;
  commission: number;
  accountCopIds: number[];
  nameAccount: string;
  nameAccountBinance: string;
  accountAmounts: { [key: number]: number }; // Nuevo campo para montos por cuenta
  dollarsUs:number;
}


@Injectable({
  providedIn: 'root'

})
export class SaleP2PService {
  private apiUrl = `${environment.apiUrl}/saleP2P`;

  constructor(private http: HttpClient) {}

  createSale(saleDto: SaleP2PDto): Observable<SaleP2PDto> {
    return this.http.post<SaleP2PDto>(this.apiUrl, saleDto);
  }

  assignAccounts(
  saleId: number,
  accounts: { amount: number, nameAccount: string, accountCop: number | null }[]
): Observable<any> {
  const url = `${this.apiUrl}/assign-account-cop?saleId=${saleId}`;
  return this.http.post(url, accounts, { responseType: 'text' as 'json' });
}

  getAllSales(): Observable<SaleP2PDto[]> {
    const url = `${this.apiUrl}/today/all-binance`;
    console.log('Fetching all sales from:', url);
    return this.http.get<SaleP2PDto[]>(url);
  }


  getAllSalesToday(account: string): Observable<SaleP2PDto[]> {
    const url = `${this.apiUrl}/today?account=${account}`;
    return this.http.get<SaleP2PDto[]>(url);
  }
}

