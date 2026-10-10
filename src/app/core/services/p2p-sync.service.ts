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

export interface ActiveP2POrder {
  orderNumber: string;
  status: string;
  statusLabel: string;
  accountBinance: string;
  dollarsUs: number;
  pesosCop: number;
  tasa: number;
  createTime: string;
  preAsignadoCopId: number | null;
  preAsignadoCopNombre: string | null;
  /** Nickname del comprador en Binance (el usuario del chat). */
  counterPartNickName?: string | null;
  estadoManual?: string; // lo sigue mandando el backend, pero ya no se usa (se quitaron los botones)
}

export interface PreAsignacionRequest {
  orderNumber: string;
  copId: number;
  accountBinance: string;
  /** Monto de la orden (miles). El backend lo guarda para sumar el verde/amarillo desde la BD. */
  pesosCop?: number;
}

/** Saldo de una cuenta COP para la vista de ventas en curso, calculado en el backend.
 *  verde = balance; amarillo (lo que se muestra) = balance + enCurso. */
export interface SaldoEnCurso {
  id: number;
  balance: number;
  cupoCajeroDisponibleHoy: number | null;
  cupoCorresponsalDisponibleHoy: number | null;
  /** Pesos (miles) de las ventas en curso pre-asignadas a la cuenta, aún no importadas. */
  enCurso: number;
  /** Qué ventas componen ese monto — para poder ver de dónde sale el amarillo. */
  detalle?: { orderNumber: string; pesos: number }[];
}

@Injectable({ providedIn: 'root' })
export class P2PSyncService {
  private apiUrl    = `${environment.apiUrl}/p2p-sync`;
  private activeUrl = `${environment.apiUrl}/api/p2p`;

  constructor(private http: HttpClient) {}

  triggerSync(): Observable<SyncResult> {
    return this.http.post<SyncResult>(`${this.apiUrl}/trigger`, {});
  }

  getSyncStatus(): Observable<P2PSyncState[]> {
    return this.http.get<P2PSyncState[]>(`${this.apiUrl}/status`);
  }

  // ── Órdenes activas ──────────────────────────────────────────

  getActiveOrders(): Observable<ActiveP2POrder[]> {
    return this.http.get<ActiveP2POrder[]>(`${this.activeUrl}/active-orders`);
  }

  /** Saldo real + ventas en curso asignadas, por cuenta COP. */
  getSaldosEnCurso(): Observable<SaldoEnCurso[]> {
    return this.http.get<SaldoEnCurso[]>(`${this.activeUrl}/saldos-en-curso`);
  }

  /** Canal REAL con el que el Auto trabaja cada cuenta: CORRESPONSAL, CAJERO o CORRESPONSAL_MANANA (por id de cuenta COP). */
  getCanalesTrabajo(): Observable<Record<number, string>> {
    return this.http.get<Record<number, string>>(`${this.activeUrl}/canales-trabajo`);
  }

  savePreAsignacion(req: PreAsignacionRequest): Observable<any> {
    return this.http.post(`${this.activeUrl}/pre-asignacion`, req);
  }

  deletePreAsignacion(orderNumber: string): Observable<any> {
    return this.http.delete(`${this.activeUrl}/pre-asignacion/${orderNumber}`);
  }

  // ── Asignación automática (interruptor global) ───────────────

  /** Estado actual del interruptor de asignación automática. */
  getAutoAsignacion(): Observable<{ activa: boolean }> {
    return this.http.get<{ activa: boolean }>(`${this.activeUrl}/auto-asignacion`);
  }

  /** Prende/apaga la asignación automática de cuentas COP a las ventas en curso. */
  setAutoAsignacion(activa: boolean): Observable<{ activa: boolean }> {
    return this.http.put<{ activa: boolean }>(`${this.activeUrl}/auto-asignacion`, { activa });
  }

  // ── Chat de órdenes (enviar la cuenta a depositar) ───────────

  /** ¿Cada cuenta Binance puede abrir el chat P2P? Sin cuenta, prueba todas. */
  probarChat(account?: string): Observable<ChatCredencialPrueba[]> {
    const q = account ? `?account=${encodeURIComponent(account)}` : '';
    return this.http.get<ChatCredencialPrueba[]>(`${this.activeUrl}/chat/probar-credencial${q}`);
  }

  /** Interruptor del envío automático de la cuenta COP por chat al asignar. */
  getChatAutoEnvio(): Observable<{ activo: boolean }> {
    return this.http.get<{ activo: boolean }>(`${this.activeUrl}/chat/auto-envio`);
  }

  setChatAutoEnvio(activo: boolean): Observable<{ activo: boolean }> {
    return this.http.put<{ activo: boolean }>(`${this.activeUrl}/chat/auto-envio`, { activo });
  }

  /** Mensajes del cliente y estado del envío de la cuenta, para las ventas en curso. */
  getResumenChat(ordenes: { orderNumber: string; accountBinance: string }[]): Observable<ChatResumenOrden[]> {
    return this.http.post<ChatResumenOrden[]>(`${this.activeUrl}/chat/resumen`, ordenes);
  }

  /** Órdenes de la cuenta en las últimas horas, incluidas las terminadas (su chat sigue abierto). */
  getOrdenesRecientesChat(account: string, horas = 24): Observable<OrdenRecienteChat[]> {
    return this.http.get<OrdenRecienteChat[]>(
      `${this.activeUrl}/chat/ordenes-recientes?account=${encodeURIComponent(account)}&horas=${horas}`);
  }

  /** Conversación del chat de una orden (últimos mensajes, del más viejo al más nuevo). */
  getConversacionChat(account: string, orderNo: string, rows = 50): Observable<ChatConversacion> {
    return this.http.get<ChatConversacion>(
      `${this.activeUrl}/chat/mensajes?account=${encodeURIComponent(account)}`
      + `&orderNo=${encodeURIComponent(orderNo)}&rows=${rows}`);
  }

  /** Texto sugerido con los datos de la cuenta COP pre-asignada a la orden. */
  getMensajeChat(orderNumber: string): Observable<{ texto: string }> {
    return this.http.get<{ texto: string }>(`${this.activeUrl}/chat/mensaje/${encodeURIComponent(orderNumber)}`);
  }

  enviarMensajeChat(accountBinance: string, orderNumber: string, texto: string): Observable<ChatSesionResultado> {
    return this.http.post<ChatSesionResultado>(`${this.activeUrl}/chat/enviar`, { accountBinance, orderNumber, texto });
  }

}

export interface ChatCredencialPrueba {
  cuenta: string;
  ok: boolean;
  code?: string;
  message?: string;
  chatWssUrl?: string;
  error?: string;
  respuestaCruda?: string;
}

export interface OrdenRecienteChat {
  orderNumber: string;
  tradeType: string | null;   // BUY / SELL
  status: string | null;      // COMPLETED, CANCELLED, TRADING…
  totalPrice: number;         // en pesos (sin dividir entre 1000)
  fiat: string | null;
  counterPartNickName: string | null;
  createTime: number;         // epoch ms
  hora: string | null;        // "dd/MM HH:mm" hora Colombia
  accountBinance: string;
}

/** Resumen del chat de una venta en curso. */
export interface ChatResumenOrden {
  orderNumber: string;
  /** createTime (ms) de los mensajes del CLIENTE: la pantalla cuenta los que no ha visto. */
  clienteTiempos: number[];
  ultimoClienteTexto?: string;
  ultimoClienteImagen?: boolean;
  errorChat?: string;
  /** Cuenta COP cuyos datos ya se enviaron por chat (y a qué hora). */
  cuentaEnviadaCopId?: number;
  cuentaEnviadaHora?: string | null;
  /** Envío automático programado que todavía no sale (espera de unos segundos). */
  envioPendiente: boolean;
  /** Motivo por el que no se pudo enviar la cuenta (p. ej. le falta la cédula). */
  envioError?: string | null;
}

export interface ChatMensaje {
  id: string | null;
  type: string | null;          // text, image, system…
  content: string | null;
  imageUrl: string | null;
  thumbnailUrl: string | null;
  self: boolean;                // true = lo mandamos nosotros
  fromNickName: string | null;
  status: string | null;        // read / unread
  createTime: number;
  hora: string | null;          // "dd/MM HH:mm:ss" hora Colombia
}

export interface ChatConversacion {
  orderNo: string;
  ok: boolean;
  total?: number;
  mensajes: ChatMensaje[];
  respuestaCruda?: string;
}

/** Resultado de una sesión con el chat: lo enviado y todo lo que respondió Binance. */
export interface ChatSesionResultado {
  cuenta: string;
  ok: boolean;
  enviado?: string;
  recibidos: string[];
  error?: string;
}
