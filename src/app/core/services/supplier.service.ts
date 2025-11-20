import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';  // Ajusta la ruta según corresponda

export interface Supplier {
  id: number;
  name: string;
  balance: number;
  lastPaymentDate: Date;
  saldoInicialDelDia?: number;

  comprasHoy?: number;
  ventasHoy?: number;
  ajustesHoy?: number;
}

@Injectable({
  providedIn: 'root',
})
export class SupplierService {
  private readonly apiUrl = `${environment.apiUrl}/supplier`;  // Asegúrate de que la URL sea correcta

  constructor(private http: HttpClient) {}

  getAllSuppliers(): Observable<Supplier[]> {
    return this.http.get<Supplier[]>(this.apiUrl);
  }

  createSupplier(data: any): Observable<Supplier> {
    return this.http.post<Supplier>(`${this.apiUrl}/suppliers`, data);
  }

  // Obtener el Supplier con ID 1
  getSupplier(): Observable<Supplier> {
    return this.http.get<Supplier>(`${this.apiUrl}/1`);  // Asegúrate que el endpoint esté configurado correctamente
  }

  // Método para agregar la entidad BuyDollars (llamado desde AsignacionesTabComponent)
  addBuyDollar(buyDollar: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/buy-dollars`, buyDollar);
  }

  // Método para actualizar el balance del Supplier después de asignar dólares
  updateSupplierBalance(supplier: Supplier): Observable<Supplier> {
    return this.http.put<Supplier>(`${this.apiUrl}/1`, supplier); // El id 1 es el único Supplier
  }

  subtractSupplierDebt(supplierId: string, amount: number): Observable<Supplier> {
    return this.http.put<Supplier>(`${this.apiUrl}/${supplierId}/subtract-debt`, { amount });
  }

  
 transferirClienteProveedor(data: { clientId: number; supplierId: number; amount: number }): Observable<string> {
  const params = `clientId=${data.clientId}&supplierId=${data.supplierId}&amount=${data.amount}`;
  return this.http.post(
    `${this.apiUrl}/transfer/client-to-supplier?${params}`,
    {}, // cuerpo vacío
    { responseType: 'text' }  // 👈 aquí va
  );
}

}
