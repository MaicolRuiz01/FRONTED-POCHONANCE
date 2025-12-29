import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';

export interface IdRef {
  id: number;
}

export interface CompraVesDto {
  id?: number;
  date?: string;

  bolivares: number;
  tasa: number;
  pesos?: number; // viene del backend

  // ✅ ASÍ lo espera tu @RequestBody CompraVES
  cliente?: IdRef | null;
  supplier?: IdRef | null;
  cuentaCop?: IdRef | null;

  // (Opcional) si tu backend serializa nombre, no estorba
  // clienteName?: string; supplierName?: string; cuentaCopName?: string;
}

@Injectable({ providedIn: 'root' })
export class CompraVesService {
  private api = `${environment.apiUrl}/api/compra-ves`;

  constructor(private http: HttpClient) {}

  list(): Observable<CompraVesDto[]> {
    return this.http.get<CompraVesDto[]>(this.api);
  }

  create(dto: CompraVesDto): Observable<CompraVesDto> {
    return this.http.post<CompraVesDto>(this.api, dto);
  }

  update(id: number, dto: CompraVesDto): Observable<CompraVesDto> {
    return this.http.put<CompraVesDto>(`${this.api}/${id}`, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }

  getByDay(day: string): Observable<CompraVesDto[]> {
    return this.http.get<CompraVesDto[]>(`${this.api}/dia?day=${day}`);
  }
}
