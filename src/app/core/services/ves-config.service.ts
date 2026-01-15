// ves-config.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environment/environment';
import { Observable } from 'rxjs';

export interface VesConfigDto {
  ves1: number;
  tasa1: number;

  ves2: number | null;
  tasa2: number | null;

  ves3: number | null;
  tasa3: number | null;

  lastUpdate?: string;
}

@Injectable({ providedIn: 'root' })
export class VesConfigService {
  private api = `${environment.apiUrl}/api/ves-config`;

  constructor(private http: HttpClient) {}

  getConfig(): Observable<VesConfigDto> {
    return this.http.get<VesConfigDto>(this.api);
  }

  updateConfig(dto: VesConfigDto): Observable<VesConfigDto> {
    return this.http.put<VesConfigDto>(this.api, dto);
  }
}
