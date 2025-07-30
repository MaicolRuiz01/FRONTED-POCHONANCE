// caja.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';

export interface Caja {
  id: number;
  name: string;
  saldo: number;
}

@Injectable({ providedIn: 'root' })
export class CajaService {
  private readonly apiUrl = `${environment.apiUrl}/efectivo`;

  constructor(private http: HttpClient) {}

  listar(): Observable<Caja[]> {
    return this.http.get<Caja[]>(this.apiUrl);
  }
  crear(caja: Partial<Caja>): Observable<Caja> {
  return this.http.post<Caja>(this.apiUrl, caja);
}

}
