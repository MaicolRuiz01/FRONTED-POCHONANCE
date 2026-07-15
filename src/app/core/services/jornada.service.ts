import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';

/** Estado de la jornada de trabajo del operador ("Empecé a trabajar" / "Terminé"). */
export interface JornadaEstado {
  id?: number;
  activa: boolean;
  startedAt?: string | null;
  endedAt?: string | null;
  transcurridoSegundos?: number;
}

@Injectable({ providedIn: 'root' })
export class JornadaService {
  private readonly apiUrl = `${environment.apiUrl}/auth/jornada`;

  constructor(private http: HttpClient) {}

  /** Inicia (o recupera) la jornada en curso. */
  iniciar(): Observable<JornadaEstado> {
    return this.http.post<JornadaEstado>(`${this.apiUrl}/iniciar`, {});
  }

  /** Termina la jornada en curso. */
  finalizar(): Observable<JornadaEstado> {
    return this.http.post<JornadaEstado>(`${this.apiUrl}/finalizar`, {});
  }

  /** Estado actual (para restaurar el botón al recargar la página). */
  actual(): Observable<JornadaEstado> {
    return this.http.get<JornadaEstado>(`${this.apiUrl}/actual`);
  }
}
