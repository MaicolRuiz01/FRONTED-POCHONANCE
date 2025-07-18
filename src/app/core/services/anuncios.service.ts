import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AnuncioDto {
  precio: string;
  moneda: string;
  fiat: string;
  minimo: string;
  maximo: string;
  metodoPago: string;
  vendedor: string;
  tipo: string;
}

@Injectable({
  providedIn: 'root',
})
export class AnunciosService {
  private readonly apiUrl = 'http://localhost:8080/api/p2p/anuncios'; // Cambia por tu IP real si es necesario.

  constructor(private http: HttpClient) {}

  getAnuncios(params: {
    asset?: string;
    fiat?: string;
    payTypes?: string[];
    page?: number;
    rows?: number;
  }): Observable<AnuncioDto[]> {
    return this.http.post<AnuncioDto[]>(this.apiUrl, {
      asset: params.asset ?? 'USDT',
      fiat: params.fiat ?? 'COP',
      payTypes: params.payTypes ?? [],
      page: params.page ?? 1,
      rows: params.rows ?? 10,
    });
  }
}
