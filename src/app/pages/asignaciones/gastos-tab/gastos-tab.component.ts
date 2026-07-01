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

  // Filtro por banco para el select de Cuenta COP
  bancosSel = new Set<string>();
  bancosDisponibles = [
    { label: 'Nequi', value: 'NEQUI' },
    { label: 'Daviplata', value: 'DAVIPLATA' },
    { label: 'Bancolombia', value: 'BANCOLOMBIA' },
  ];

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

  toggleBanco(b: string): void {
    if (this.bancosSel.has(b)) this.bancosSel.delete(b);
    else this.bancosSel.add(b);
    // Si la cuenta ya elegida no está en el filtro, la limpiamos.
    if (this.cuentaSeleccionadaId != null &&
        !this.cuentasFiltradas.some(c => c.id === this.cuentaSeleccionadaId)) {
      this.cuentaSeleccionadaId = undefined;
    }
  }

  bancoActivo(b: string): boolean { return this.bancosSel.has(b); }

  /** Cuentas COP filtradas por el/los banco(s) seleccionado(s). Vacío = todas. */
  get cuentasFiltradas(): AccountCop[] {
    if (this.bancosSel.size === 0) return this.cuentas;
    return this.cuentas.filter(c => this.bancosSel.has(c.bankType));
  }

  ngOnInit(): void {
    // Mostrar al instante lo último cargado (evita esperar el listado completo).
    const cache = this.accountService.getCached();
    if (cache.length) this.cuentas = cache;
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
      fecha: this.formatFecha((g as any).fecha),
      origen: this.buildOrigen(g)
    })) as (Gasto & { origen: string })[];
  }

  /** Fecha legible: "30/06/2026 11:45" en vez del ISO con microsegundos. */
  private formatFecha(iso: any): string {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return String(iso);
    return new Intl.DateTimeFormat('es-CO', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: false
    }).format(d);
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
      // El gasto restó el saldo → refrescar cuentas y avisar a otras vistas.
      this.accountService.getAll().subscribe(data => this.cuentas = data);
      this.accountService.notificarCambioP2P();
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
