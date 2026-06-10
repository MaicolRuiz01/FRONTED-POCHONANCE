import { Injectable } from "@angular/core";
import { Cliente } from "./cliente.service";
import { MovimientoService } from "./movimiento.service";
import { Movimiento } from "./pago-proveedor.service";
import { Supplier } from "./supplier.service";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "../../../environment/environment";

export interface AjustesDto {
  id: number;
  contenido: string;
  movimientoid: number;
  usuariocl_id: number | null;
  usuariopr_id: number | null;
  monto: number;
}

@Injectable({
  providedIn: 'root',
})
export class AjustesService {


private readonly apiUrl = `${environment.apiUrl}/ajustes`;

 constructor(private http: HttpClient) {}

  listar(): Observable<AjustesDto[]> {
    return this.http.get<AjustesDto[]>(`${this.apiUrl}/listar`);
  }

  obtenerPorId(id: number): Observable<AjustesDto> {
    return this.http.get<AjustesDto>(`${this.apiUrl}/${id}`);
  }

  crear(ajuste: Partial<AjustesDto>): Observable<AjustesDto> {
    return this.http.post<AjustesDto>(`${this.apiUrl}/crear`, ajuste);
  }

  obtenerporcliente(clienteId: number): Observable<AjustesDto[]> {
    return this.http.get<AjustesDto[]>(`${this.apiUrl}/cliente/${clienteId}`);
  }

  obtenerporproveedor(proveedorId: number): Observable<AjustesDto[]> {
    return this.http.get<AjustesDto[]>(`${this.apiUrl}/proveedor/${proveedorId}`);
  }








}
