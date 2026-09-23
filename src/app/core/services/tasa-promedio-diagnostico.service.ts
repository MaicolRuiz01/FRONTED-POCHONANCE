import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';

/**
 * Una fila del diagnóstico de la tasa promedio: la foto de un recálculo.
 * Es solo lectura — no interviene en ningún cálculo, sirve para revisar qué pasó.
 */
export interface TasaPromedioDiagnostico {
  id: number;
  fecha: string;
  /** APERTURA_SESION (abrió sesión nueva) o LICUA_SESION (se sumó a una ya abierta). */
  evento: string;

  buyDollarsId?: number | null;
  compraUsdt?: number | null;
  compraTasa?: number | null;
  compraPesos?: number | null;

  /** Valor de TODO el portafolio en dólares que devolvió Binance. Principal sospechoso. */
  saldoExternoLeido?: number | null;
  otrosPendientesUsdt?: number | null;

  saldoBaseUsdt?: number | null;
  tasaBase?: number | null;
  pesosBase?: number | null;
  /** true = el saldo era menor que la compra y la base se perdió. */
  baseRecortadaACero?: boolean | null;

  usdtAcumSesion?: number | null;
  pesosAcumSesion?: number | null;

  tasaAnterior?: number | null;
  tasaResultante?: number | null;
  totalUsdt?: number | null;
  totalPesos?: number | null;

  averageRateId?: number | null;
  sesionAbierta?: boolean | null;
  inicioDia?: string | null;
}

@Injectable({ providedIn: 'root' })
export class TasaPromedioDiagnosticoService {
  private apiUrl = `${environment.apiUrl}/tasa-promedio`;

  constructor(private http: HttpClient) {}

  listar(): Observable<TasaPromedioDiagnostico[]> {
    return this.http.get<TasaPromedioDiagnostico[]>(`${this.apiUrl}/diagnostico`);
  }
}
