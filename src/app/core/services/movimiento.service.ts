import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';
import { Movimiento } from './pago-proveedor.service';

export interface MovimientoDto {
  id: number;
  tipo: string; 
  monto: number;
  cuentaFromId: number;
  cuentaToId?: number;
  fecha: Date;
  descripcion?: string;
  caja?: number;

}

export interface MovimientoVistaCuentaCopDto {
  id: number;
  tipo: string;
  fecha: Date;
  montoSigned: number;
  entrada: boolean;
  salida: boolean;
  detalle: string;
}

export interface PagoClienteAClienteDto {
  clienteOrigenId: number;
  clienteDestinoId: number;
  usdt: number;
  tasaOrigen: number;
  tasaDestino: number;
  nota?: string;
}

export interface MovimientoVistaDto {
  id?: number; 
  tipo: string;
  fecha: Date;
  monto: number;
  cuentaOrigen?: string;
  cuentaDestino?: string;
  caja?: number;
}
export interface PagoClienteAProveedorDto {
  clienteOrigenId: number;
  proveedorDestinoId: number;
  usdt: number;
  tasaCliente: number;
  tasaProveedor: number;
  nota?: string;
}
export interface PagoProveedorAClienteDto {
  proveedorOrigenId: number;
  clienteDestinoId: number;
  usdt: number;
  tasaProveedor: number;
  tasaCliente: number;
  nota?: string;
}


export type EntidadAjuste = 'CLIENTE' | 'PROVEEDOR' | 'CUENTACOP' | 'CAJA';

export interface AjusteSaldoDto {
  entidad: EntidadAjuste;
  entidadId: number;
  monto: number;
  entrada: boolean;
  motivo: string;
  actor?: string;
}
export interface ResumenDiario {
  comprasHoy: number;
  ventasHoy: number;
  ajustesHoy: number;
}


export interface MovimientoAjusteDto {
  id: number;
  tipo: string;
  fecha: Date;
  monto: number;
  motivo?: string;
  actor?: string;
  saldoAnterior?: number;
  saldoNuevo?: number;
  diferencia?: number;
}


@Injectable({
  providedIn: 'root'
})
export class MovimientoService {
  private apiUrl = `${environment.apiUrl}/movimiento`;

  constructor(private http: HttpClient) { }

  createMovimiento(movimiento: MovimientoDto): Observable<MovimientoDto> {
    return this.http.post<MovimientoDto>(this.apiUrl, movimiento);
  }

  actualizarMovimientoVista(id: number, movimiento: MovimientoDto): Observable<MovimientoVistaDto> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.put<MovimientoVistaDto>(url, movimiento);
  }

  getMovimientosByCuenta(cuentaId: number): Observable<MovimientoDto[]> {
    const url = `${this.apiUrl}/cuenta/${cuentaId}`;
    return this.http.get<MovimientoDto[]>(url);
  }

  getAllMovimientos(): Observable<MovimientoDto[]> {
    return this.http.get<MovimientoDto[]>(`${this.apiUrl}/listar`);
  }

  registrarRetiro(idCuentaOrigen: number, monto: number) {
    const url = `${this.apiUrl}/retiro?cuentaId=${idCuentaOrigen}&monto=${monto}`;
    return this.http.post(url, {});
  }

  registrarDeposito(idCuentaDestino: number, monto: number) {
    const url = `${this.apiUrl}/deposito?cuentaId=${idCuentaDestino}&monto=${monto}`;
    return this.http.post(url, {});
  }

  registrarTransferencia(idCuentaOrigen: number, idCuentaDestino: number, monto: number) {
    const url = `${this.apiUrl}/transferencia?origenId=${idCuentaOrigen}&destinoId=${idCuentaDestino}&monto=${monto}`;
    return this.http.post(url, {});
  }

  getTransferencias(): Observable<MovimientoVistaDto[]> {
    const url = `${this.apiUrl}/transferencias`;
    return this.http.get<MovimientoVistaDto[]>(url);
  }

  getDepositos(): Observable<MovimientoVistaDto[]> {
    const url = `${this.apiUrl}/depositos`;
    return this.http.get<MovimientoVistaDto[]>(url);
  }

  getRetiros(): Observable<MovimientoVistaDto[]> {
    const url = `${this.apiUrl}/retiros`;
    return this.http.get<MovimientoVistaDto[]>(url);
  }
  registrarPagoCliente(cuentaId: number, clienteId: number, monto: number) {
    const url = `${this.apiUrl}/pago?cuentaId=${cuentaId}&clienteId=${clienteId}&monto=${monto}`;
    return this.http.post<MovimientoVistaDto>(url, {});
  }
  registrarPagoProveedor(
    cuentaId: number | null,
    cajaId: number | null,
    proveedorOrigenId: number | null,
    proveedorDestinoId: number,
    monto: number,
    clienteId?: number | null
  ): Observable<any> {

    let params = new HttpParams()
      .set('monto', monto.toString())
      .set('proveedor', proveedorDestinoId.toString());

    if (cuentaId !== null) params = params.set('cuentaId', cuentaId.toString());
    if (cajaId !== null) params = params.set('caja', cajaId.toString());
    if (proveedorOrigenId !== null) params = params.set('proveedorOrigen', proveedorOrigenId.toString());
    if (clienteId) params = params.set('clienteId', clienteId.toString());
    return this.http.post(`${this.apiUrl}/pago-proveedor`, {}, { params });
  }


  actualizarMovimiento(id: number, movimiento: Partial<MovimientoDto>): Observable<MovimientoDto> {
    return this.http.put<MovimientoDto>(`${this.apiUrl}/${id}`, movimiento);
  }

  getMovimientosPorCliente(clienteId: number): Observable<MovimientoVistaDto[]> {
    const url = `${this.apiUrl}/cliente/${clienteId}`;
    return this.http.get<MovimientoVistaDto[]>(url);
  }

  getPagosPorCuenta(cuentaId: number): Observable<MovimientoVistaDto[]> {
    return this.http.get<MovimientoVistaDto[]>(
      `${this.apiUrl}/pagos-cuenta/${cuentaId}`
    );
  }
  pagoClienteACliente(dto: PagoClienteAClienteDto): Observable<any> {
    return this.http.post(`${this.apiUrl}/pago-cliente-a-cliente`, dto);
  }
  getMovimientosPorCaja(cajaId: number) {
    return this.http.get<any[]>(
      `${environment.apiUrl}/movimiento/caja/${cajaId}`
    );
  }

  pagoClienteAProveedor(dto: PagoClienteAProveedorDto): Observable<any> {
    return this.http.post(`${this.apiUrl}/pago-cliente-a-proveedor`, dto);
  }

  pagoClienteAClienteCop(clienteOrigenId: number, clienteDestinoId: number, montoCop: number): Observable<any> {
    const params = new HttpParams()
      .set('clienteOrigenId', clienteOrigenId)
      .set('clienteDestinoId', clienteDestinoId)
      .set('montoCop', montoCop);
    return this.http.post(`${this.apiUrl}/pago-cliente-a-cliente-cop`, {}, { params });
  }
  eliminarMovimiento(movimiento: Movimiento): Observable<void> {
    const url = `${this.apiUrl}/eliminar/${movimiento.id}`;
    return this.http.delete<void>(url);
  }

  pagoProveedorACliente(dto: PagoProveedorAClienteDto): Observable<any> {
    return this.http.post(`${this.apiUrl}/pago-proveedor-a-cliente`, dto);
  }
  ajustarSaldo(dto: AjusteSaldoDto) {
    return this.http.post(`${this.apiUrl}/ajuste-saldo`, dto);
  }

  getVistaCuentaCop(cuentaId: number): Observable<MovimientoVistaCuentaCopDto[]> {
    return this.http.get<MovimientoVistaCuentaCopDto[]>(
      `${this.apiUrl}/vista/cuenta-cop/${cuentaId}`
    );
  }

  getVistaCliente(clienteId: number): Observable<MovimientoVistaCuentaCopDto[]> {
    return this.http.get<MovimientoVistaCuentaCopDto[]>(
      `${this.apiUrl}/vista/cliente/${clienteId}`
    );
  }

  getVistaProveedor(proveedorId: number): Observable<MovimientoVistaCuentaCopDto[]> {
    return this.http.get<MovimientoVistaCuentaCopDto[]>(
      `${this.apiUrl}/vista/proveedor/${proveedorId}`
    );
  }
  getResumenCliente(clienteId: number): Observable<ResumenDiario> {
    return this.http.get<ResumenDiario>(
      `${this.apiUrl}/resumen/cliente/${clienteId}`
    );
  }
  getResumenProveedor(proveedorId: number): Observable<ResumenDiario> {
    return this.http.get<ResumenDiario>(
      `${this.apiUrl}/resumen/proveedor/${proveedorId}`
    );
  }
  pagoCuentaCopACliente(cuentaId: number, clienteId: number, monto: number) {
    const params = new HttpParams()
      .set("cuentaId", cuentaId)
      .set("clienteId", clienteId)
      .set("monto", monto);

    return this.http.post(`${this.apiUrl}/pago-cuenta-cop-a-cliente`, {}, { params });
  }

getAjustesCliente(clienteId: number): Observable<MovimientoAjusteDto[]> {
  return this.http.get<MovimientoAjusteDto[]>(
    `${this.apiUrl}/ajustes/cliente/${clienteId}`
  );
}

getAjustesProveedor(proveedorId: number): Observable<MovimientoAjusteDto[]> {
  return this.http.get<MovimientoAjusteDto[]>(
    `${this.apiUrl}/ajustes/proveedor/${proveedorId}`
  );
}

getAjustesCuentaCop(cuentaId: number): Observable<MovimientoAjusteDto[]> {
  return this.http.get<MovimientoAjusteDto[]>(
    `${this.apiUrl}/ajustes/cuenta-cop/${cuentaId}`
  );
}

getAjustesCaja(cajaId: number): Observable<MovimientoAjusteDto[]> {
  return this.http.get<MovimientoAjusteDto[]>(
    `${this.apiUrl}/ajustes/caja/${cajaId}`
  );
}

}