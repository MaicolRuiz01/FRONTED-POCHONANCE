import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';

export interface IdRef { id: number; }

export interface VentaVesDto {
  id?: number;
  date?: string;

  bolivares: number;
  tasa: number;
  pesos?: number;

  // ✅ así lo espera tu backend (VentaVES entity en @RequestBody)
  cliente?: IdRef | null;
  proveedor?: IdRef | null;
  cuentaCop?: IdRef | null;

  // opcionales si el backend los devuelve
  clienteName?: string;
  proveedorName?: string;
  cuentaCopName?: string;
}

@Injectable({ providedIn: 'root' })
export class VentaVesService {
  private api = `${environment.apiUrl}/api/venta-ves`;

  constructor(private http: HttpClient) {}

  list(): Observable<VentaVesDto[]> {
    return this.http.get<VentaVesDto[]>(this.api);
  }

  create(dto: VentaVesDto): Observable<VentaVesDto> {
    return this.http.post<VentaVesDto>(this.api, dto);
  }

  update(id: number, dto: VentaVesDto): Observable<VentaVesDto> {
    return this.http.put<VentaVesDto>(`${this.api}/${id}`, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }

  getByDay(day: string): Observable<VentaVesDto[]> {
    return this.http.get<VentaVesDto[]>(`${this.api}/dia?day=${day}`);
  }
}
