import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';

/**
 * Reasignación manual de ventas P2P.
 *
 * (La auto-asignación por reglas fue retirada a pedido del cliente; este
 *  servicio conserva únicamente la reasignación puntual manual.)
 */
@Injectable({ providedIn: 'root' })
export class P2PAssignmentRuleService {
  private apiUrl = `${environment.apiUrl}/p2p-rule`;

  constructor(private http: HttpClient) {}

  /** Reasigna manualmente una venta P2P ya asignada a otra cuenta COP. */
  reassignSale(saleId: number, copAccountId: number): Observable<string> {
    return this.http.put(
      `${this.apiUrl}/reassign/${saleId}?copAccountId=${copAccountId}`,
      {},
      { responseType: 'text' }
    );
  }
}
