import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';

@Injectable({
  providedIn: 'root'
})
export class TraspasosService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getTraspasosHistory(account: string): Observable<any> {
    return this.http.get(`${this.baseUrl}api/payments?account=${account}`);
  }
}
