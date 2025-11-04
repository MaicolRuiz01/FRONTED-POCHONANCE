import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';
import { Movimiento } from './pago-proveedor.service';

export interface MovimientoDto {
  id: number;
  tipo: string; // 'retiro', 'deposito', 'transferencia', 'pago'
  monto: number;
  cuentaFromId: number;
  cuentaToId?: number; // Solo para transferencias
  fecha: Date;
  descripcion?: string;
  caja?: number;
  
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
  id?: number; // 🔹 importante para poder editar
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
  tasaCliente: number;    // COP/USDT del cliente
  tasaProveedor: number;  // COP/USDT del proveedor
  nota?: string;
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
    return this.http.get<MovimientoDto[]>(this.apiUrl);
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
}

  


