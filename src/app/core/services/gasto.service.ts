import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';

export interface Gasto {
  id?: number;
  descripcion: string;
  monto: number;
  cuentaPago?: { id: number };
  pagoEfectivo?: { id: number };
  fecha?: string; // solo si el backend lo devuelve
}
@Injectable({
  providedIn: 'root'
})
export class GastoService {
  private apiUrl = environment.apiUrl + '/gastos';

  constructor(private http: HttpClient) {}

  listar(): Observable<Gasto[]> {
    return this.http.get<Gasto[]>(this.apiUrl);
  }

  crear(gasto: Gasto): Observable<Gasto> {
    return this.http.post<Gasto>(this.apiUrl, gasto);
  }

  pagar(id: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}/pagar`, {});

  }
  getTotalGastosHoyCuentaCop(id: number) {
  return this.http.get<number>(`${this.apiUrl}/total-hoy/cuenta-cop/${id}`);
}

getTotalGastosHoyCaja(id: number) {
  return this.http.get<number>(`${this.apiUrl}/total-hoy/caja/${id}`);
}

}
