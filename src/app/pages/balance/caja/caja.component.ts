import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-caja',
  standalone: true,
  imports: [],
  templateUrl: './caja.component.html',
  styleUrl: './caja.component.css'
})
export class CajaComponent {
  constructor(private router: Router) {}

}
