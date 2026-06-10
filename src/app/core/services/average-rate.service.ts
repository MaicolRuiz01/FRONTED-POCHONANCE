import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';

export interface AverageRateDto {
  id?: number;
  fecha: string;              // LocalDateTime en backend
  averageRate: number;
  saldoTotalInterno: number;

  dia?: string;               // LocalDate (opcional si lo expones)
  saldoInicialDia?: number;
  tasaBaseSaldoInicial?: number;
  totalUsdtComprasDia?: number;
  totalPesosComprasDia?: number;
}

@Injectable({
  providedIn: 'root'
})
export class AverageRateService {
  private readonly apiUrl = `${environment.apiUrl}/tasa-promedio`;

  constructor(private http: HttpClient) {}

  /** Última tasa promedio registrada (puede ser del día actual o anterior) */
  getUltimaTasa(): Observable<AverageRateDto | null> {
    return this.http.get<AverageRateDto | null>(`${this.apiUrl}/ultima`);
  }

  /**
   * Inicializa la tasa promedio inicial.
   * Asumo que el backend expone POST /api/average-rate/inicializar
   * y recibe { tasaInicial: number }.
   */
  inicializarTasa(tasaInicial: number): Observable<AverageRateDto> {
    return this.http.post<AverageRateDto>(
      `${this.apiUrl}/inicializar`,
      { tasaInicial }
    );
  }
}
