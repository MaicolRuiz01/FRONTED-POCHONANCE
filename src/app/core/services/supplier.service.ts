import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';  // Ajusta la ruta según corresponda

export interface Supplier {
    id: string;
    name: string;
    balance: number;
    lastPaymentDate: Date;
  }
  
  @Injectable({
    providedIn: 'root',
  })
  export class SupplierService {
    private readonly apiUrl = `${environment.apiUrl}/supplier`;
  
    constructor(private http: HttpClient) {}
  
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
  }