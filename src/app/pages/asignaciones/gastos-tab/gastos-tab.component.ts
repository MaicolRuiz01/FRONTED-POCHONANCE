import { Component, OnInit } from '@angular/core';
import { GastoService, Gasto } from '../../../core/services/gasto.service';
import { AccountCop, AccountCopService } from '../../../core/services/account-cop.service';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { SharedModule } from '../../../shared/shared.module';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CalendarModule } from 'primeng/calendar';

import { TableColumn } from '../../../shared/mi-table/mi-table.component';
import { MiTableComponent } from '../../../shared/mi-table/mi-table.component';

@Component({
  selector: 'app-gastos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    TableModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    CalendarModule,
    MiTableComponent
  ],
  templateUrl: './gastos-tab.component.html',
  styleUrls: ['./gastos-tab.component.css']
})
export class GastosComponent implements OnInit {
  gastos: Gasto[] = [];
  productDialog = false;
  nuevoGasto: Gasto = { descripcion: '', monto: 0 };

  cuentas: AccountCop[] = [];
  cajas: { id: number, name: string, saldo: number }[] = [];

  tipoPago: 'cuenta' | 'caja' = 'cuenta';
  cuentaSeleccionadaId?: number;
  cajaSeleccionadaId?: number;

  columns: TableColumn[] = [
    { campo: 'fecha', columna: 'Fecha' },
    { campo: 'descripcion', columna: 'Descripción' },
    { campo: 'monto', columna: 'Monto' }
  ];

  constructor(
    private gastoService: GastoService,
    private accountService: AccountCopService
  ) {}

  ngOnInit(): void {
    this.cargarGastos();
    this.accountService.getAll().subscribe(data => this.cuentas = data);
    this.accountService.getAllCajas().subscribe(data => this.cajas = data);
  }

  cargarGastos(): void {
    this.gastoService.listar().subscribe(data => this.gastos = data);
  }

  openNew(): void {
    this.nuevoGasto = { descripcion: '', monto: 0 };
    this.tipoPago = 'cuenta';
    this.cuentaSeleccionadaId = undefined;
    this.cajaSeleccionadaId = undefined;
    this.productDialog = true;
  }

  crearGasto(): void {
    if (this.tipoPago === 'cuenta' && this.cuentaSeleccionadaId) {
      this.nuevoGasto.cuentaPago = { id: this.cuentaSeleccionadaId } as any;
      this.nuevoGasto.pagoEfectivo = undefined;
    } else if (this.tipoPago === 'caja' && this.cajaSeleccionadaId) {
      this.nuevoGasto.pagoEfectivo = { id: this.cajaSeleccionadaId } as any;
      this.nuevoGasto.cuentaPago = undefined;
    }

    this.gastoService.crear(this.nuevoGasto).subscribe(() => {
      this.productDialog = false;
      this.cargarGastos();
    });
  }
}
