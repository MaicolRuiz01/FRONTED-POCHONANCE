import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';

export interface ResumenOperador {
  username: string;
  rol: 'ADMIN' | 'OPERARIO' | null;
  ingresos: number;
  tiempoTotalSegundos: number;
  sesionAbierta: boolean;
}

@Injectable({ providedIn: 'root' })
export class SesionService {
  private readonly apiUrl = `${environment.apiUrl}/auth/sesion`;

  constructor(private http: HttpClient) {}

  /** Resumen por día: ingresos y tiempo total por operador. fecha = 'YYYY-MM-DD' (opcional; por defecto hoy). */
  getResumen(fecha?: string): Observable<ResumenOperador[]> {
    let params = new HttpParams();
    if (fecha) params = params.set('fecha', fecha);
    return this.http.get<ResumenOperador[]>(`${this.apiUrl}/resumen`, { params });
  }
}
