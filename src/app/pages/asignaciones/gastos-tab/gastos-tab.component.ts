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
  gastosView: (Gasto & { origen: string })[] = [];
  cuentas: AccountCop[] = [];
  cajas: { id: number, name: string, saldo: number }[] = [];

  tipoPago: 'cuenta' | 'caja' = 'cuenta';
  cuentaSeleccionadaId?: number;
  cajaSeleccionadaId?: number;

  columns: TableColumn[] = [
    { campo: 'fecha', columna: 'Fecha' },
    { campo: 'descripcion', columna: 'Descripción' },
    { campo: 'origen', columna: 'Origen' },
    { campo: 'monto', columna: 'Monto' }
  ];


  constructor(
    private gastoService: GastoService,
    private accountService: AccountCopService
  ) { }

  ngOnInit(): void {
    this.accountService.getAll().subscribe(data => {
      this.cuentas = data;
      this.refreshGastosView();
    });

    this.accountService.getAllCajas().subscribe(data => {
      this.cajas = data;
      this.refreshGastosView();
    });

    this.cargarGastos();
  }

  cargarGastos(): void {
    this.gastoService.listar().subscribe(data => {
      this.gastos = data;
      this.refreshGastosView();
    });
  }

  private refreshGastosView(): void {
    // si aún no han cargado gastos, no hace nada
    if (!this.gastos) return;

    this.gastosView = this.gastos.map(g => ({
      ...g,
      origen: this.buildOrigen(g)
    }));
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

  private buildOrigen(g: Gasto): string {
    if (g.cuentaPago?.id) {
      const c = this.cuentas.find(x => x.id === g.cuentaPago!.id);
      return c ? `Cuenta COP: ${c.name}` : `Cuenta COP: #${g.cuentaPago.id}`;
    }
    if (g.pagoEfectivo?.id) {
      const caja = this.cajas.find(x => x.id === g.pagoEfectivo!.id);
      return caja ? `Caja: ${caja.name}` : `Caja: #${g.pagoEfectivo.id}`;
    }
    return '—';
  }

}
