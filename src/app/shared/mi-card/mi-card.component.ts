import { Component, Input, OnInit } from '@angular/core';
import { CuentasService } from '../../core/services/cuentas.service';

@Component({
  selector: 'app-mi-card',
  templateUrl: './mi-card.component.html',
  styleUrls: ['./mi-card.component.css']
})
export class MiCardComponent implements OnInit {
  @Input() cuentaId!: number;  // ID de la cuenta (recibido desde otro componente)
  cuenta: any = {};  // Datos de la cuenta

  constructor(private cuentasService: CuentasService) {}

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    if (this.cuentaId) {
      this.cuentasService.obtenerCuenta(this.cuentaId).subscribe(data => {
        this.cuenta = data;
      }, error => {
        console.error('Error al obtener datos de la cuenta:', error);
      });
    }
  }
}
