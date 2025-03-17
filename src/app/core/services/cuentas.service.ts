import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';  // Importar environment

@Injectable({
  providedIn: 'root'
})
export class CuentasService {
  private apiUrl = environment.apiUrl;  // ✅ URL dinámica

  constructor(private http: HttpClient) {}

  obtenerCuenta(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/cuentas/${id}`);
  }
}
