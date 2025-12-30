import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';

export interface VesConfigDto {
  ves1: number;
  tasa1: number;
  ves2: number;
  tasa2: number;
  ves3: number;
  tasa3: number;
  lastUpdate?: string;
}

@Injectable({ providedIn: 'root' })
export class VesConfigService {
  private api = `${environment.apiUrl}/api/ves-config`;

  constructor(private http: HttpClient) {}

  getConfig() {
    return this.http.get<VesConfigDto>(this.api);
  }

  updateConfig(dto: VesConfigDto) {
    return this.http.put<VesConfigDto>(this.api, dto);
  }
}
