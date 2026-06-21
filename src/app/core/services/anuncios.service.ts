import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';

export interface AnuncioDto {
  cuenta: string;
  precio: string;
  moneda: string;
  fiat: string;
  minimo: string;
  maximo: string;
  metodoPago: string;
  vendedor: string;
  tipo: string;
  horaAnuncio: string;
  disponible: string;
  advNo: string;
}

@Injectable({ providedIn: 'root' })
export class AnunciosService {
  private readonly base = `${environment.apiUrl}/api/p2p`;

  constructor(private http: HttpClient) {}

  getAnuncios(params: {
    asset?: string;
    fiat?: string;
    payTypes?: string[];
    page?: number;
    rows?: number;
  }): Observable<AnuncioDto[]> {
    return this.http.post<AnuncioDto[]>(`${this.base}/anuncios`, {
      asset:    params.asset    ?? 'USDT',
      fiat:     params.fiat     ?? 'COP',
      payTypes: params.payTypes ?? [],
      page:     params.page     ?? 1,
      rows:     params.rows     ?? 10,
    });
  }

  /** Anuncios activos de las propias cuentas del cliente */
  getMisAnuncios(): Observable<AnuncioDto[]> {
    return this.http.get<AnuncioDto[]>(`${this.base}/mis-anuncios`);
  }
}
