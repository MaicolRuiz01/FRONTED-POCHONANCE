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

  // Anti-doble-registro: bloquea el botón mientras el POST va en camino.
  guardando = false;

  // Eliminar gasto (con confirmación y reversión de saldo en backend).
  confirmDialog = false;
  gastoAEliminar: (Gasto & { origen?: string }) | null = null;
  eliminando = false;
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
    // Clave de idempotencia única por modal: aunque el usuario haga varios clics,
    // todos los POST llevan la misma clave y el backend crea el gasto una sola vez.
    this.nuevoGasto = { descripcion: '', monto: 0, idempotencyKey: this.nuevaKey() };
    this.tipoPago = 'cuenta';
    this.cuentaSeleccionadaId = undefined;
    this.cajaSeleccionadaId = undefined;
    this.guardando = false;
    this.productDialog = true;
  }

  private nuevaKey(): string {
    // crypto.randomUUID cuando existe; si no, fallback simple.
    const c: any = (typeof crypto !== 'undefined') ? crypto : null;
    if (c && typeof c.randomUUID === 'function') return c.randomUUID();
    return 'gasto-' + Date.now() + '-' + Math.random().toString(36).slice(2);
  }

  crearGasto(): void {
    // Candado en el frontend: si ya hay un guardado en curso, ignora clics extra.
    if (this.guardando) return;
    this.guardando = true;

    if (this.tipoPago === 'cuenta' && this.cuentaSeleccionadaId) {
      this.nuevoGasto.cuentaPago = { id: this.cuentaSeleccionadaId } as any;
      this.nuevoGasto.pagoEfectivo = undefined;
    } else if (this.tipoPago === 'caja' && this.cajaSeleccionadaId) {
      this.nuevoGasto.pagoEfectivo = { id: this.cajaSeleccionadaId } as any;
      this.nuevoGasto.cuentaPago = undefined;
    }

    // Guardamos referencias antes del POST (para construir la fila local).
    const desc = this.nuevoGasto.descripcion;
    const monto = this.nuevoGasto.monto;
    const cuentaPago = this.nuevoGasto.cuentaPago;
    const pagoEfectivo = this.nuevoGasto.pagoEfectivo;

    this.gastoService.crear(this.nuevoGasto).subscribe({
      next: (resp) => {
        this.guardando = false;
        this.productDialog = false;

        // Sin re-fetch: agregamos la fila localmente con el id que devolvió el backend.
        const creado: Gasto = {
          id: resp?.id,
          descripcion: desc,
          monto,
          cuentaPago,
          pagoEfectivo,
          fecha: resp?.fecha ?? new Date().toISOString()
        };
        this.gastos = [creado, ...this.gastos];
        this.refreshGastosView();

        // Ajuste local del saldo (para dropdowns) sin pedir todo de nuevo.
        this.ajustarSaldoLocal(creado, -1);
        this.accountService.notificarCambioP2P();
      },
      error: () => {
        // Reactiva el botón para que el usuario pueda reintentar (misma key = sin duplicado).
        this.guardando = false;
      }
    });
  }

  /** Ajusta el saldo local de la cuenta/caja afectada. signo -1 = resta (crear), +1 = devuelve (eliminar). */
  private ajustarSaldoLocal(g: Gasto, signo: 1 | -1): void {
    const monto = g.monto || 0;
    if (g.cuentaPago?.id) {
      const c = this.cuentas.find(x => x.id === g.cuentaPago!.id);
      if (c) c.balance = (c.balance || 0) + signo * monto * 1.004;
    }
    if (g.pagoEfectivo?.id) {
      const caja = this.cajas.find(x => x.id === g.pagoEfectivo!.id);
      if (caja) caja.saldo = (caja.saldo || 0) + signo * monto;
    }
  }

  pedirEliminar(gasto: Gasto & { origen?: string }): void {
    this.gastoAEliminar = gasto;
    this.confirmDialog = true;
  }

  confirmarEliminar(): void {
    const gasto = this.gastoAEliminar;
    if (!gasto?.id || this.eliminando) return;
    const id = gasto.id;

    // === Borrado optimista: quitamos la fila YA (se siente instantáneo). ===
    const idx = this.gastos.findIndex(x => x.id === id);
    const backup = idx >= 0 ? this.gastos[idx] : null;
    if (idx >= 0) this.gastos.splice(idx, 1);
    this.refreshGastosView();
    this.ajustarSaldoLocal(gasto, +1);       // devolvemos el saldo localmente
    this.confirmDialog = false;
    this.gastoAEliminar = null;
    this.accountService.notificarCambioP2P();

    // El backend confirma en segundo plano; si falla, revertimos.
    this.gastoService.eliminar(id).subscribe({
      error: () => {
        if (backup) {
          this.gastos.splice(Math.max(idx, 0), 0, backup);
          this.refreshGastosView();
          this.ajustarSaldoLocal(gasto, -1);  // deshacemos la devolución local
        }
      }
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
