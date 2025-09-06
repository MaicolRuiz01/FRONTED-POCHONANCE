import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// PrimeNG
import { Table, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

import { OrdenesCriptoService, OrdenSpotDTO } from '../../core/services/ordenes-cripto.service';
import { AccountBinanceService, AccountBinance } from '../../core/services/account-binance.service';
import { finalize, of } from 'rxjs';

@Component({
  selector: 'app-ordenes-cripto',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    TagModule,
    ProgressSpinnerModule
  ],
  templateUrl: './ordenes-cripto.component.html',
  styleUrls: ['./ordenes-cripto.component.css']
})
export class OrdenesCriptoComponent implements OnInit {
  @ViewChild('dt') dt!: Table;

  loadingTable = false;   // carga del listado
  importing    = false;   // spinner pequeño de importación en 2º plano

  ordenes: OrdenSpotDTO[] = [];
  filtroCuenta = '';      // se manda al backend
  filtroGlobal = '';      // filtro frontend

  cuentas: AccountBinance[] = [];
  limiteImport = 50;

  constructor(
    private ordenesSrv: OrdenesCriptoService,
    private cuentasSrv: AccountBinanceService
  ) {}

  ngOnInit(): void {
    // 1) pintar lo que YA hay guardado
    this.listar();

    // 2) correr la importación en segundo plano y refrescar al terminar
    this.importarEnSegundoPlano();

    // opcional: cargar cuentas para dropdown o filtros más adelante
    this.cuentasSrv.traerCuentas().subscribe({
      next: (cs) => (this.cuentas = cs.filter(c => c.tipo?.toUpperCase() === 'BINANCE')),
      error: () => {}
    });
  }

  /** Solo lista (no importa). */
  listar(): void {
    this.loadingTable = true;
    this.ordenesSrv.listar(this.filtroCuenta || undefined)
      .pipe(finalize(() => (this.loadingTable = false)))
      .subscribe({
        next: (data) => (this.ordenes = data.map(d => this.adapt(d))),
        error: () => (this.ordenes = [])
      });
  }

  /** Importa TODO en 2º plano y luego refresca la tabla, sin bloquearla. */
  importarEnSegundoPlano(): void {
    this.importing = true;
    this.ordenesSrv.importarTodas(this.limiteImport)
      .pipe(finalize(() => (this.importing = false)))
      .subscribe({
        next: () => this.listar(),
        error: () => {
          // si falla, no rompemos la UI; mantenemos lo ya listado
        }
      });
  }

  /** Re-importar (2º plano) + refrescar cuando termine. */
  refrescar(): void {
    this.importarEnSegundoPlano();
  }

  /** Re-lista por cuenta (sin re-importar). */
  buscarPorCuenta(): void {
    this.listar();
  }

  onGlobalFilter(ev: Event) {
    const value = (ev.target as HTMLInputElement)?.value ?? '';
    this.dt?.filterGlobal(value, 'contains');
  }

  tagSeverity(lado: string) {
    if (!lado) return 'info';
    return lado.toUpperCase() === 'BUY' ? 'success' : 'danger';
  }

  // Adaptador defensivo por si cambian nombres en el backend
  private adapt(d: any): OrdenSpotDTO {
    const num = (v: any) => (v == null ? 0 : typeof v === 'string' ? parseFloat(v) : Number(v));
    return {
      id: d.id ?? d.ID ?? 0,
      idOrden: d.idOrden ?? d.orderId ?? 0,
      cuenta: d.cuenta ?? d.accountName ?? d.account ?? '',
      simbolo: d.simbolo ?? d.symbol ?? '',
      lado: d.lado ?? d.side ?? '',
      estado: d.estado ?? d.status ?? '',
      precio: num(d.precio ?? d.price ?? d.avgPrice),
      cantidadBase: num(d.cantidadBase ?? d.baseQty ?? d.executedBaseQty),
      cantidadQuote: num(d.cantidadQuote ?? d.quoteQty ?? d.executedQuoteQty),
      comisionUsdt: num(d.comisionUsdt ?? d.commission ?? d.feeTotalUsdt),
      fecha: d.fecha ?? d.time ?? d.filledAt ?? null
    };
  }
}
