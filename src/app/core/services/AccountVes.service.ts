import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';
import { CompraVesDto } from './compra-ves.service';
import { VentaVesDto } from './venta-ves.service';
export interface AccountVes {
  id?: number;
  name: string;
  balance: number;
  saldoInicialDelDia?: number;

  // Campos que podrías usar después para resumen diario
  entradasHoy?: number;
  salidasHoy?: number;
  ajustesHoy?: number;
  // etc si luego quieres
}

export interface AccountVesCreate {
  name: string;
  balance: number;
}

@Injectable({
  providedIn: 'root'
})
export class AccountVesService {

  // Coincide con tu controlador backend: @RequestMapping("/cuenta-ves")
  private apiUrl = `${environment.apiUrl}/cuenta-ves`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<AccountVes[]> {
    return this.http.get<AccountVes[]>(this.apiUrl);
  }

  getById(id: number): Observable<AccountVes> {
    return this.http.get<AccountVes>(`${this.apiUrl}/${id}`);
  }

  create(dto: AccountVesCreate): Observable<AccountVes> {
    return this.http.post<AccountVes>(this.apiUrl, dto);
  }

  update(id: number, dto: AccountVes): Observable<AccountVes> {
    return this.http.put<AccountVes>(`${this.apiUrl}/${id}`, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getCompras(id: number): Observable<CompraVesDto[]> {
  return this.http.get<CompraVesDto[]>(`${this.apiUrl}/${id}/compras`);
}

getVentas(id: number): Observable<VentaVesDto[]> {
  return this.http.get<VentaVesDto[]>(`${this.apiUrl}/${id}/ventas`);
}
}
