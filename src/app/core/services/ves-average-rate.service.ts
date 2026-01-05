// ves-average-rate.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';

export interface VesAverageRateDto {
  id: number;
  dia: string;
  tasaPromedioDia: number;
  tasaBaseCop: number;
  saldoInicialVes: number;
  saldoFinalVes: number;
}

@Injectable({ providedIn: 'root' })
export class VesAverageRateApiService {
  private apiUrl = `${environment.apiUrl}/api/ves-average-rate`;

  constructor(private http: HttpClient) {}

  getUltima(): Observable<VesAverageRateDto | null> {
    return this.http.get<VesAverageRateDto | null>(`${this.apiUrl}/ultima`);
  }

  // 👇 OJO: el campo se llama tasaInicialCopPorVes igual que en InitVesRateRequest
  setInicial(tasa: number): Observable<VesAverageRateDto> {
    return this.http.post<VesAverageRateDto>(
      `${this.apiUrl}/inicializar`,
      { tasaInicialCopPorVes: tasa }
    );
  }
}
