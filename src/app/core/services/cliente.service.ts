import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';

export interface Cliente {
    id: number;
    nombre: String;
    correo: String;
    nameUser: String;
    saldo: number;
    wallet: String;
}

@Injectable({
  providedIn: 'root',
})
export class ClienteService {
  private readonly apiUrl = `${environment.apiUrl}/cliente`;

  constructor(private http: HttpClient) {}

  listar(): Observable<Cliente[]> {
    return this.http.get<Cliente[]>(`${this.apiUrl}/listar`);
  }

  obtenerPorId(id: number): Observable<Cliente> {
    return this.http.get<Cliente>(`${this.apiUrl}/${id}`);
  }

  crear(cliente: Partial<Cliente>): Observable<Cliente> {
    return this.http.post<Cliente>(this.apiUrl, cliente);
  }

  actualizar(cliente: Cliente): Observable<Cliente> {
    return this.http.put<Cliente>(`${this.apiUrl}/${cliente.id}`, cliente);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // ✅ nuevo método para el pago entre clientes
  transferir(pago: { origenId: number; destinoId: number; monto: number; nota?: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/transferir`, pago);
  }

  // ✅ nuevo método para obtener el historial de transacciones de un cliente
  historial(clienteId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${clienteId}/historial-transacciones`);
  }
}
