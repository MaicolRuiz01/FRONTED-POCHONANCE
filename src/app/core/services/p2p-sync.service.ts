import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';

export interface SyncResult {
  nuevasVentas: number;
  mensaje: string;
}

export interface P2PSyncState {
  id: number;
  binanceAccountName: string;
  lastSyncAtMs: number;
  lastSyncTime: string;
}

@Injectable({ providedIn: 'root' })
export class P2PSyncService {
  private apiUrl = `${environment.apiUrl}/p2p-sync`;

  constructor(private http: HttpClient) {}

  triggerSync(): Observable<SyncResult> {
    return this.http.post<SyncResult>(`${this.apiUrl}/trigger`, {});
  }

  getSyncStatus(): Observable<P2PSyncState[]> {
    return this.http.get<P2PSyncState[]>(`${this.apiUrl}/status`);
  }
}
