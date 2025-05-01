
import { Router } from '@angular/router';
import { SharedModule } from '../../../app/shared/shared.module';
import { Table } from 'primeng/table';
import { Component, OnInit } from '@angular/core';
import { GastoService, Gasto } from '../../core/services/gasto.service';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { CalendarModule } from 'primeng/calendar';



@Component({
  selector: 'app-gastos',
  standalone: true,
  imports: [SharedModule,
    CommonModule,
     FormsModule,
      ButtonModule,
      ReactiveFormsModule,
      TableModule,
      DialogModule,
      CalendarModule,
      InputTextModule,
  ],
  templateUrl: './gastos.component.html',
  styleUrls: ['./gastos.component.css']
})
export class GastosComponent implements OnInit{
  gastos: Gasto[] = [];
  productDialog = false;
  nuevoGasto: Gasto = { tipo: { id: 1 }, descripcion: '', fecha: '', monto: 0, pagado: false };

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
    this.nuevoGasto = { tipo: { id: 1 }, descripcion: '', fecha: '', monto: 0, pagado: false };
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
