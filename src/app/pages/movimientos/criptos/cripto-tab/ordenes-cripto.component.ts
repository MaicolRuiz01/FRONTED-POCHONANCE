import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Table, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

import {
  OrdenesCriptoService,
  OrdenSpotDTO
} from '../../../../core/services/ordenes-cripto.service';
import {
  AccountBinance,
  AccountBinanceService
} from '../../../../core/services/account-binance.service';
import { finalize } from 'rxjs';

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

  loadingTable = false;
  importing = false;

  ordenes: OrdenSpotDTO[] = [];
  filtroCuenta = '';
  filtroGlobal = '';

  cuentas: AccountBinance[] = [];
  limiteImport = 50;

  constructor(
    private ordenesSrv: OrdenesCriptoService,
    private cuentasSrv: AccountBinanceService
  ) {}

  ngOnInit(): void {
    this.listar();
  }

  listar(): void {
    this.loadingTable = true;
    this.ordenesSrv
      .listar(this.filtroCuenta || undefined)
      .pipe(finalize(() => (this.loadingTable = false)))
      .subscribe({
        next: (data) => (this.ordenes = data.map((d) => this.adapt(d))),
        error: () => (this.ordenes = [])
      });
  }

  importarEnSegundoPlano(): void {
    this.importing = true;
    this.ordenesSrv
      .importarTodas(this.limiteImport)
      .pipe(finalize(() => (this.importing = false)))
      .subscribe({
        next: () => this.listar(),
        error: () => {}
      });
  }

  refrescar(): void {
    this.importarEnSegundoPlano();
  }

  buscarPorCuenta(): void {
    this.listar();
  }

  onGlobalFilter(ev: Event) {
    const value = (ev.target as HTMLInputElement)?.value ?? '';
    this.dt?.filterGlobal(value, 'contains');
  }

  tagSeverity(tipo: string) {
    if (!tipo) return 'info';
    const up = tipo.toUpperCase();
    // COMPRA = verde, VENTA = rojo
    return up === 'COMPRA' ? 'success' : 'danger';
  }

  // Adaptador defensivo: acepta tanto DTO nuevo (SpotOrder) como posibles nombres viejos
  private adapt(d: any): OrdenSpotDTO {
    const num = (v: any) =>
      v == null ? 0 : typeof v === 'string' ? parseFloat(v) : Number(v);

    return {
      id: d.id ?? d.ID ?? 0,
      idOrdenBinance:
        d.idOrdenBinance ?? d.idOrden ?? d.orderId ?? 0,
      cuenta:
        d.cuenta ??
        d.cuentaBinanceNombre ??
        d.accountName ??
        d.account ??
        '',
      simbolo: d.simbolo ?? d.symbol ?? '',
      cripto: d.cripto ?? '',
      tipoOperacion: d.tipoOperacion ?? d.lado ?? d.side ?? '',
      cantidadCripto:
        num(d.cantidadCripto ?? d.baseQty ?? d.executedBaseQty),
      tasaUsdt: num(d.tasaUsdt ?? d.price ?? d.avgPrice),
      totalUsdt:
        num(d.totalUsdt ?? d.quoteQty ?? d.executedQuoteQty),
      comisionUsdt:
        num(d.comisionUsdt ?? d.commission ?? d.feeTotalUsdt),
      fechaOperacion:
        d.fechaOperacion ?? d.fecha ?? d.time ?? d.filledAt ?? null
    };
  }
}
