import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';
import { PagoProveedorDTO } from '../../pages/clientes/tabs/proveedor-tab/proveedor.component';


export interface Movimiento {
  id: number;
  tipo: 'INGRESO' | 'EGRESO';
  monto: number;
  fecha: Date;
  descripcion: string;
  proveedorId?: number;
  // Añade aquí otros campos relevantes como 'proveedorId' o 'cuentaId'
}

@Injectable({
  providedIn: 'root'
})
export class PagoProveedorService {
  

  private apiUrl = `${environment.apiUrl}/pago-proveedor`;
  private Url2 = `${environment.apiUrl}/movimiento`;

  constructor(private http: HttpClient) {}

  makePayment(accountCopId: number, supplierId: number, amount: number): Observable<any> {
    const url = `${this.apiUrl}/hecho?accountCopId=${accountCopId}&supplierId=${supplierId}&amount=${amount}`;
    return this.http.post(url, {});
  }

   getPagosBySupplier(supplierId: number): Observable<any[]> {
    const url = `${this.apiUrl}/por-supplier/${supplierId}`;
    return this.http.get<any[]>(url);  // Retorna los pagos asociados a ese proveedor
  }

  getMovimientosBySupplier(supplierId: number): Observable<PagoProveedorDTO[]> {
    const url = `${this.Url2}/pagos-proveedor/${supplierId}`;
    return this.http.get<PagoProveedorDTO[]>(url);
  }

}
