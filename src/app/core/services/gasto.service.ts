import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';

export interface Gasto {
  id?: number;
  tipo: { id: number };
  descripcion: string;
  fecha: string;
  monto: number;
  pagado: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class GastoService {
  private apiUrl = environment.apiUrl + 'api/gastos';

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
}
