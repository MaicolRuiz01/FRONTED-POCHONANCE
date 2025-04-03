import { Component, OnInit } from '@angular/core';
import { GastoService, Gasto } from '../../../core/services/gasto.service';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';


@Component({
  selector: 'app-operativo',
  templateUrl: './operativo.component.html',
  standalone: true,
  imports: [CommonModule,
     FormsModule,
      ButtonModule, 
      ReactiveFormsModule,
      TableModule,      
      DialogModule,     
      InputTextModule ],
  styleUrls: ['./operativo.component.css']
})
export class OperativoComponent implements OnInit {
  gastos: Gasto[] = [];
  productDialog = false;
  nuevoGasto: Gasto = { tipo_id: { id: 1 }, descripcion: '', fecha: '', monto: 0, pagado: false };

  constructor(private gastoService: GastoService) {}

  ngOnInit() {
    this.cargarGastos();
  }

  cargarGastos() {
    this.gastoService.listar().subscribe(data => {
      this.gastos = data;
    });
  }

  openNew() {
    this.nuevoGasto = { tipo_id: { id: 1 }, descripcion: '', fecha: '', monto: 0, pagado: false };
    this.productDialog = true;
  }

  pagar(gasto: Gasto) {
    this.gastoService.pagar(gasto.id!).subscribe(() => {
      gasto.pagado = true;
    });
  }

  crearGasto() {
    this.gastoService.crear(this.nuevoGasto).subscribe(() => {
      this.productDialog = false;
      this.cargarGastos();
    });
  }
}
