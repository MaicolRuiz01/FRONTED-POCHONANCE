import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';

import {
  BalanceGeneral,
  BalanceGeneralService, CryptoResumenDia
} from '../../../../core/services/balance-general.service';

import { AccountCop } from '../../../../core/services/account-cop.service';

interface BalanceDetailSection {
  total?: number;
  comision?: number;
  cuatroPorMil?: number;
  utilidad?: number;
}

interface BalanceDetail {
  tasaProm: number;
  ventas: BalanceDetailSection;
  p2p: BalanceDetailSection;
  dec: BalanceDetailSection;
  comisionesTotal: number;
  retiros: number;
  traslado: number;
  pagosProveedor: number;
  trx: number;
  reintegroTrust: number;
  gastos: number;
  ajustes: number;
  totalCalculado: number;
}

@Component({
  selector: 'app-caja',
  standalone: true,
  imports: [
    CommonModule,
    DialogModule,
    ButtonModule,
    CardModule,
  ],
  templateUrl: './caja.component.html',
  styleUrls: ['./caja.component.css'],
})
export class CajaComponent implements OnInit {

  balances: BalanceGeneral[] = [];

  showDetailsModal = false;
  showAdditionalInfoModal = false;
  selectedBalance: BalanceGeneral | null = null;
  gains: number[] = [];
  detail: BalanceDetail | null = null;
  totalCajaObj: Record<string, number> = {};
  totalCajaArr: { nombre: string; monto: number }[] = [];
  totalClientes: number = 0;
  cuentas: AccountCop[] = [];
  criptosHoy: CryptoResumenDia[] = [];

  constructor(private balanceService: BalanceGeneralService) { }

  ngOnInit(): void {
    this.loadBalances();
  }

  // === Carga REAL desde backend, sin mocks ===
  loadBalances(): void {
    this.balanceService.listar().subscribe({
      next: (data) => {
        this.balances = (data || []).sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        this.computeGains();
        console.log('Balances desde backend:', this.balances);
        if (this.balances.length > 0) {
          const hoy = this.balances[0];
          this.criptosHoy = this.parseCriptos(hoy.detalleCriptosJson);
        } else {
          this.criptosHoy = [];
        }
      },
      error: (err) => {
        console.error('Error cargando balances', err);
      },
    });
  }

  // === Calcula ganancia diaria por índice ===
  private computeGains(): void {
    this.gains = [];
    for (let i = 0; i < this.balances.length; i++) {
      const today = this.balances[i];
      const yesterday = this.balances[i + 1];
      const saldoToday = today?.saldo ?? 0;
      const saldoYesterday = yesterday?.saldo ?? 0;
      this.gains[i] = saldoToday - saldoYesterday;
    }
  }

  getGain(index: number): number {
    return this.gains[index] ?? 0;
  }

  // Suma las fuentes para cada tarjeta
  getCardTotal(b: BalanceGeneral): number {
    const cripto = b.saldoCuentasBinance ?? 0;
    const clientes = b.clientesSaldo ?? 0;
    const proveedores = b.proveedores ?? 0;
    const cuentasCop = b.cuentasCop ?? 0;
    const cajas = b.saldoCajas ?? 0;
    return cripto + clientes + proveedores + cuentasCop + cajas;
  }

  // Total agregado para la mini-card superior
  get totalAggregate(): number {
    return this.balances.reduce(
      (acc, b) => acc + this.getCardTotal(b),
      0
    );
  }

  // === Lupa: prepara detalle y abre modal ===
  prepareDetail(b: BalanceGeneral): void {
    this.selectedBalance = b;

    const ventasTotal = b.totalVentasGeneralesDelDia ?? 0;
    const ventasUtilidad = b.utilidadVentasGenerales ?? 0;
    const p2pTotal = b.totalP2PdelDia ?? 0;
    const p2pComisiones = b.comisionesP2PdelDia ?? 0;
    const p2pUtilidad = b.utilidadP2P ?? 0;
    const cuatroPorMil = b.cuatroPorMilDeVentas ?? 0;
    const comisionTrust = b.comisionTrust ?? 0;

    const retiros = 0;
    const traslado = 0;
    const pagosProveedor = b.proveedores ?? 0;
    const trx = 0;
    const reintegroTrust = comisionTrust;
    const gastos = 0;
    const ajustes = 0;

    const comisionesTotal = p2pComisiones + cuatroPorMil + comisionTrust;

    const totalCalculado =
      ventasTotal +
      p2pTotal -
      comisionesTotal +
      reintegroTrust -
      (retiros + traslado + pagosProveedor + trx + gastos) +
      ajustes +
      this.getCardTotal(b);

    this.detail = {
      tasaProm: b.tasaPromedioDelDia ?? 0,
      ventas: {
        total: ventasTotal,
        comision: ventasUtilidad,
        cuatroPorMil,
        utilidad: ventasUtilidad,
      },
      p2p: {
        total: p2pTotal,
        comision: p2pComisiones,
        utilidad: p2pUtilidad,
      },
      dec: {
        total: 0,
        comision: 0,
        utilidad: 0,
      },
      comisionesTotal,
      retiros,
      traslado,
      pagosProveedor,
      trx,
      reintegroTrust,
      gastos,
      ajustes,
      totalCalculado,
    };

    this.showDetailsModal = true;
  }

  // Atajo si quieres seguir usando showDetails(balance)
  showDetails(row: BalanceGeneral): void {
    this.prepareDetail(row);
  }

  // === Lógica original de “Info adicional” ===
  showAdditionalInfo(): void {
    this.balanceService.totalCaja().subscribe({
      next: (data) => {
        this.totalCajaObj = data || {};
        this.totalCajaArr = Object.entries(this.totalCajaObj).map(
          ([nombre, monto]) => ({
            nombre,
            monto: Number(monto ?? 0),
          })
        );
      },
      error: (err) => {
        console.error('Error cargando total caja', err);
      },
    });

    this.balanceService.totalClientes().subscribe({
      next: (total) => {
        this.totalClientes = total;
        this.showAdditionalInfoModal = true;
      },
      error: (err) => {
        console.error('Error cargando total clientes', err);
        this.showAdditionalInfoModal = true;
      },
    });
  }

  closeModal(): void {
    this.showDetailsModal = false;
    this.showAdditionalInfoModal = false;
    this.selectedBalance = null;
    this.detail = null;
  }

  // Stub para el botón de refrescar tarjeta
  syncCard(b: BalanceGeneral): void {
    console.log('Sincronizar tarjeta (stub):', b.id ?? b.date);
  }
  private parseCriptos(json?: string | null): CryptoResumenDia[] {
    if (!json) return [];
    try {
      const arr = JSON.parse(json);
      if (Array.isArray(arr)) {
        return arr as CryptoResumenDia[];
      }
      return [];
    } catch (e) {
      console.error('Error parseando detalleCriptosJson', e);
      return [];
    }
  }
}
