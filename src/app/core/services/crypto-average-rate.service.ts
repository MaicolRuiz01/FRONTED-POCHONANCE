import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';

export interface CryptoAverageRateDto {
  id?: number;
  cripto: string;          // "TRX", "BNB", etc.
  dia: string;             // "2025-11-15"
  fechaCalculo: string;    // LocalDateTime ISO
  saldoInicialCripto: number;
  tasaBaseUsdt: number;
  totalCriptoCompradaDia: number;
  totalUsdtComprasDia: number;
  tasaPromedioDia: number;
  saldoFinalCripto: number;
}

@Injectable({
  providedIn: 'root'
})
export class CryptoAverageRateService {

  private readonly apiUrl = `${environment.apiUrl}/api/crypto-average-rate`;

  constructor(private http: HttpClient) {}

  /** Última tasa registrada para una cripto (puede ser null si nunca se ha inicializado) */
  getUltimaPorCripto(cripto: string): Observable<CryptoAverageRateDto | null> {
    return this.http.get<CryptoAverageRateDto | null>(
      `${this.apiUrl}/ultima`,
      { params: { cripto } }
    );
  }

  /**
   * Inicializa la tasa promedio de una cripto.
   * Backend usará el saldo externo real para calcular el saldo inicial.
   */
  inicializarCripto(cripto: string, tasaInicialUsdt: number): Observable<CryptoAverageRateDto> {
    return this.http.post<CryptoAverageRateDto>(
      `${this.apiUrl}/inicializar`,
      { cripto, tasaInicialUsdt }
    );
  }
}
