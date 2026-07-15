import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';

/** Tarjeta de un usuario en el panel OPERADORES (solo ADMIN). */
export interface OperadorCard {
  id: number;
  username: string;
  rol: 'ADMIN' | 'OPERARIO' | null;
  passwordPlano: string | null;
  tiempoTrabajadoSegundos: number;
  pagoCop: number;
  jornadaActiva: boolean;
}

export interface CrearOperadorRequest {
  username: string;
  password: string;
  rol: 'ADMIN' | 'OPERARIO';
}

@Injectable({ providedIn: 'root' })
export class OperadorService {
  private readonly apiUrl = `${environment.apiUrl}/auth`;

  constructor(private http: HttpClient) {}

  /** Resumen del día: una tarjeta por usuario con tiempo trabajado, pago y credenciales. */
  getResumen(fecha?: string): Observable<OperadorCard[]> {
    const q = fecha ? `?fecha=${fecha}` : '';
    return this.http.get<OperadorCard[]>(`${this.apiUrl}/operadores/resumen${q}`);
  }

  /** Crea un nuevo usuario/operador. */
  crear(req: CrearOperadorRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/registro`, req);
  }

  /** Restablece la contraseña de un usuario (queda guardada en texto plano para compartir). */
  cambiarPassword(id: number, password: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/usuarios/${id}/password`, { password });
  }

  /** Elimina un usuario. */
  eliminar(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/usuarios/${id}`);
  }

  /** Tarifa por hora actual (COP). */
  getTarifa(): Observable<{ valorHora: number }> {
    return this.http.get<{ valorHora: number }>(`${this.apiUrl}/operadores/tarifa`);
  }

  /** Actualiza la tarifa por hora (COP). */
  setTarifa(valorHora: number): Observable<{ valorHora: number }> {
    return this.http.put<{ valorHora: number }>(`${this.apiUrl}/operadores/tarifa`, { valorHora });
  }
}
