import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, tap } from 'rxjs';
import { environment } from '../../../environment/environment';
import { SaleP2PDto } from './sale-p2p.service';

export type BankTypeCop = 'NEQUI' | 'DAVIPLATA' | 'BANCOLOMBIA';
export type CupoTipoP2P = 'CAJERO' | 'CORRESPONSAL' | 'AMBOS';

export interface BrebeKey {
  id?: number;
  llave: string;
  descripcion?: string;
}

export interface AccountCop {
  id?: number;
  name: string;
  balance: number;
  saldoInicialDelDia?: number;
  entradasHoy?: number;
  salidasHoy?: number;
  ajustesHoy?: number;
  ventasDolaresHoy?: number;
  gastosHoy?: number;
  salidasRetirosHoy?: number;
  isFlipped?: boolean;
  bankType: BankTypeCop;
  cupoDisponibleHoy?: number;
  cupoCajeroDisponibleHoy?: number;
  cupoCorresponsalDisponibleHoy?: number;
  numeroCuenta?: string;
  cedula?: string;
  activaParaP2P?: boolean;
  cupoTipoP2P?: CupoTipoP2P;
  brebeKeys?: BrebeKey[];
}

/**
 * ✅ SOLO lo que el backend necesita para crear.
 * Nada de entradasHoy, isFlipped, etc.
 */
export interface AccountCopCreate {
  name: string;
  balance: number;
  bankType: BankTypeCop;
  numeroCuenta?: string;
  cedula?: string;
}

export interface CompraP2PCuenta {
  buyId: number;
  numberOrder: string;
  date: string;
  tasa: number;
  dollarsUs: number;
  pesosCop: number;
  montoAsignado: number;
  binanceAccountName?: string;
}

@Injectable({ providedIn: 'root' })
export class AccountCopService {
  private apiUrl = `${environment.apiUrl}/cuenta-cop`;

  /** Se emite cuando cambia el estado P2P de alguna cuenta (activar/desactivar),
   *  para que las distintas vistas (modal y tira de cuentas) se sincronicen. */
  private p2pCambio = new Subject<void>();
  p2pCambio$ = this.p2pCambio.asObservable();

  notificarCambioP2P(): void {
    this.p2pCambio.next();
  }

  constructor(private http: HttpClient) { }

  /** Última lista cargada — para mostrar al instante al re-entrar a la vista. */
  private cacheCuentas: AccountCop[] = [];
  getCached(): AccountCop[] { return this.cacheCuentas; }

  getAll(): Observable<AccountCop[]> {
    return this.http.get<AccountCop[]>(this.apiUrl).pipe(
      tap(list => this.cacheCuentas = list ?? [])
    );
  }

  /** Consulta liviana: solo id + saldo de cada cuenta. Rápida, para refrescar el saldo siempre. */
  getSaldos(): Observable<{ id: number; balance: number }[]> {
    return this.http.get<{ id: number; balance: number }[]>(`${this.apiUrl}/saldos`);
  }

  /** Total COP disponible (mismo valor para la card y el label): suma de saldos
   *  − 4x1000 diferido pendiente, y a ese neto se le resta el 4x1000 de sacarlo. */
  getTotalDisponible(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/total-disponible`);
  }

  create(account: AccountCopCreate): Observable<AccountCop> {
    if (!account.name?.trim()) {
      throw new Error('Name cannot be empty');
    }
    if (account.balance == null) {
      throw new Error('Balance cannot be null');
    }
    if (!account.bankType) {
      throw new Error('BankType is required');
    }
    return this.http.post<AccountCop>(this.apiUrl, account);
  }

  getSalesByAccountCopId(accountCopId: number): Observable<SaleP2PDto[]> {
    return this.http.get<SaleP2PDto[]>(`${this.apiUrl}/${accountCopId}/sales`);
  }

  getComprasP2PByAccountCopId(accountCopId: number): Observable<CompraP2PCuenta[]> {
    return this.http.get<CompraP2PCuenta[]>(`${this.apiUrl}/${accountCopId}/compras-p2p`);
  }

  getTotalBalance(): Observable<number> {
    return this.http.get<number>(`${environment.apiUrl}/cuenta-binance/total-balance`);
  }

  getAllCajas(): Observable<{ id: number; name: string; saldo: number }[]> {
    return this.http.get<{ id: number; name: string; saldo: number }[]>(`${environment.apiUrl}/efectivo`);
  }

  getById(id: number): Observable<AccountCop> {
    return this.http.get<AccountCop>(`${this.apiUrl}/${id}`);
  }

  toggleActivaParaP2P(id: number): Observable<AccountCop> {
    return this.http.patch<AccountCop>(`${this.apiUrl}/${id}/toggle-p2p`, {});
  }

  setCupoTipo(id: number, cupoTipoP2P: CupoTipoP2P): Observable<AccountCop> {
    return this.http.patch<AccountCop>(`${this.apiUrl}/${id}/cupo-tipo`, { cupoTipoP2P });
  }

  downloadExcel(accountCopId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/excel/${accountCopId}`, { responseType: 'blob' });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  addBrebeKey(accountId: number, llave: string, descripcion?: string): Observable<BrebeKey> {
    return this.http.post<BrebeKey>(`${this.apiUrl}/${accountId}/brebe-keys`, { llave, descripcion });
  }

  deleteBrebeKey(accountId: number, keyId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${accountId}/brebe-keys/${keyId}`);
  }
}
