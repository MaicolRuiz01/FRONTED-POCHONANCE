import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';

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

export interface MovimientoVistaDto {
  id?: number; // 🔹 importante para poder editar
  tipo: string;
  fecha: Date;
  monto: number;
  cuentaOrigen?: string;
  cuentaDestino?: string;
  caja?: string;
}

@Injectable({
  providedIn: 'root'
})
export class MovimientoService {
  private apiUrl = `${environment.apiUrl}/movimiento`;

  constructor(private http: HttpClient) {}

  createMovimiento(movimiento: MovimientoDto): Observable<MovimientoDto> {
    return this.http.post<MovimientoDto>(this.apiUrl, movimiento);
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

  registrarPagoCliente(cuentaId: number, clienteId: number, monto: number) {
    const url = `${this.apiUrl}/pago?cuentaId=${cuentaId}&clienteId=${clienteId}&monto=${monto}`;
    return this.http.post<MovimientoVistaDto>(url, {});
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

  // 🔹 Nuevo método para actualizar un movimiento
  actualizarMovimiento(id: number, movimiento: Partial<MovimientoDto | MovimientoVistaDto>): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, movimiento);
  }
}
