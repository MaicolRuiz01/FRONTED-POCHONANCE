import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';

export interface P2PAssignmentRule {
  id?: number;
  /** El backend devuelve el objeto completo, no un campo plano */
  binanceAccount?: { id?: number; name?: string };
  copAccount?: { id?: number; name?: string; balance?: number; bankType?: string };
  active: boolean;
  updatedAt?: string;
}

export interface SetRuleRequest {
  binanceAccount: string;
  copAccountId: number;
}

@Injectable({ providedIn: 'root' })
export class P2PAssignmentRuleService {
  private apiUrl = `${environment.apiUrl}/p2p-rule`;

  constructor(private http: HttpClient) {}

  setRule(req: SetRuleRequest): Observable<P2PAssignmentRule> {
    return this.http.post<P2PAssignmentRule>(this.apiUrl, req);
  }

  getRule(binanceAccount: string): Observable<P2PAssignmentRule> {
    return this.http.get<P2PAssignmentRule>(`${this.apiUrl}/${encodeURIComponent(binanceAccount)}`);
  }

  getAllRules(): Observable<P2PAssignmentRule[]> {
    return this.http.get<P2PAssignmentRule[]>(this.apiUrl);
  }

  pauseRule(binanceAccount: string): Observable<string> {
    return this.http.put(`${this.apiUrl}/${encodeURIComponent(binanceAccount)}/pause`, {}, { responseType: 'text' });
  }

  resumeRule(binanceAccount: string): Observable<string> {
    return this.http.put(`${this.apiUrl}/${encodeURIComponent(binanceAccount)}/resume`, {}, { responseType: 'text' });
  }

  deleteRule(binanceAccount: string): Observable<string> {
    return this.http.delete(`${this.apiUrl}/${encodeURIComponent(binanceAccount)}`, { responseType: 'text' });
  }

  reassignSale(saleId: number, copAccountId: number): Observable<string> {
    return this.http.put(
      `${this.apiUrl}/reassign/${saleId}?copAccountId=${copAccountId}`,
      {},
      { responseType: 'text' }
    );
  }
}
