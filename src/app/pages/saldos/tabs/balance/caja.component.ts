import { Component, OnInit } from '@angular/core';
import { BalanceGeneral, BalanceGeneralService } from '../../../../core/services/balance-general.service';
import { DialogModule } from 'primeng/dialog';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';

import { TableColumn } from '../../../../shared/mi-table/mi-table.component';
import { MiTableComponent } from '../../../../shared/mi-table/mi-table.component';
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
    DialogModule,
    CommonModule,
    TableModule,
    ButtonModule,
    MiTableComponent,
    CardModule
  ],
  templateUrl: './caja.component.html',
  styleUrls: ['./caja.component.css'],
})
export class CajaComponent implements OnInit {
  balances: BalanceGeneral[] = [];
  showDetailsModal = false;
  showAdditionalInfoModal = false;
  selectedBalance: BalanceGeneral | null = null;

  // array con ganancias diarias por índice (ganancia = saldo[i] - saldo[i+1])
  gains: number[] = [];

  // Detalle calculado/mostrado en el diálogo de la lupa
  detail: BalanceDetail | null = null;

  totalCajaObj: Record<string, number> = {};
  totalCajaArr: { nombre: string; monto: number }[] = [];
  totalClientes: number = 0;

  cuentas: AccountCop[] = [];

  columns: TableColumn[] = [
    { campo: 'date', columna: 'Fecha' },
    { campo: 'saldo', columna: 'Saldo' }
  ];

  constructor(private balanceService: BalanceGeneralService) { }

  ngOnInit() {
    this.loadBalances();
  }

  // ---- loadBalances: intenta cargar desde el servicio; si viene vacío o falla, carga mock para probar UI ----
  loadBalances(): void {
    this.balanceService.listar().subscribe({
      next: (data) => {
        this.balances = (data || []).sort((a, b) => {
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        });

        if (!this.balances || this.balances.length === 0) {
          console.warn('BalanceGeneralService.listar() devolvió vacío — cargando datos de prueba (mock).');
          this.populateMockData();
        }

        this.computeGains();
        console.log('Balances cargados:', this.balances);
      },
      error: (err) => {
        console.error('Error cargando balances desde el servicio, cargando mock para pruebas:', err);
        this.populateMockData();
        this.computeGains();
      },
    });
  }

  // ---- populateMockData: datos de prueba coherentes para verificar la UI ----
  private populateMockData(): void {
    const mock: BalanceGeneral[] = [
      {
        id: 1,
        date: '2025-10-29T00:00:00Z',
        saldo: 55844393,
        tasaPromedioDelDia: 3760.07,
        tasaVentaDelDia: 3800,
        totalP2PdelDia: 15560,
        comisionesP2PdelDia: 127000,
        cuatroPorMilDeVentas: 556000,
        utilidadP2P: 156000,
        totalVentasGeneralesDelDia: 15560,
        utilidadVentasGenerales: 4256,
        clientesSaldo: -5000000,
        saldoCajas: 20000000,
        comisionTrust: 76500,
        saldoCuentasBinance: 23500000,
        proveedores: 4500000,
        cuentasCop: 15000000
      },
      {
        id: 2,
        date: '2025-10-28T00:00:00Z',
        saldo: 48200112,
        tasaPromedioDelDia: 3760,
        tasaVentaDelDia: 3795,
        totalP2PdelDia: 15560,
        comisionesP2PdelDia: 127000,
        cuatroPorMilDeVentas: 556000,
        utilidadP2P: 156000,
        totalVentasGeneralesDelDia: 15560,
        utilidadVentasGenerales: 4256,
        clientesSaldo: -3200000,
        saldoCajas: 14900112,
        comisionTrust: 0,
        saldoCuentasBinance: 18000000,
        proveedores: 2500000,
        cuentasCop: 16000000
      },
      {
        id: 3,
        date: '2025-10-27T00:00:00Z',
        saldo: 62110870,
        tasaPromedioDelDia: 3755,
        tasaVentaDelDia: 3780,
        totalP2PdelDia: 15560,
        comisionesP2PdelDia: 127000,
        cuatroPorMilDeVentas: 556000,
        utilidadP2P: 156000,
        totalVentasGeneralesDelDia: 15560,
        utilidadVentasGenerales: 4256,
        clientesSaldo: -6500000,
        saldoCajas: 16000000,
        comisionTrust: 0,
        saldoCuentasBinance: 30000000,
        proveedores: 5610870,
        cuentasCop: 18000000
      },
      {
        id: 4,
        date: '2025-10-26T00:00:00Z',
        saldo: 41320700,
        tasaPromedioDelDia: 3748,
        tasaVentaDelDia: 3770,
        totalP2PdelDia: 12000,
        comisionesP2PdelDia: 46000,
        cuatroPorMilDeVentas: 220700,
        utilidadP2P: 10000,
        totalVentasGeneralesDelDia: 12000,
        utilidadVentasGenerales: 8000,
        clientesSaldo: -2000000,
        saldoCajas: 10000000,
        comisionTrust: 0,
        saldoCuentasBinance: 10000000,
        proveedores: 3320700,
        cuentasCop: 20000000
      },
      {
        id: 5,
        date: '2025-10-25T00:00:00Z',
        saldo: 37900000,
        tasaPromedioDelDia: 3740,
        tasaVentaDelDia: 3760,
        totalP2PdelDia: 14000,
        comisionesP2PdelDia: 12350,
        cuatroPorMilDeVentas: 180000,
        utilidadP2P: 9000,
        totalVentasGeneralesDelDia: 14000,
        utilidadVentasGenerales: 7000,
        clientesSaldo: -1200000,
        saldoCajas: 10600000,
        comisionTrust: 0,
        saldoCuentasBinance: 12000000,
        proveedores: 2500000,
        cuentasCop: 14000000
      },
      {
        id: 6,
        date: '2025-10-24T00:00:00Z',
        saldo: 50250450,
        tasaPromedioDelDia: 3735,
        tasaVentaDelDia: 3765,
        totalP2PdelDia: 20000,
        comisionesP2PdelDia: 390450,
        cuatroPorMilDeVentas: 390450,
        utilidadP2P: 15000,
        totalVentasGeneralesDelDia: 20000,
        utilidadVentasGenerales: 12000,
        clientesSaldo: -4250000,
        saldoCajas: 13000000,
        comisionTrust: 0,
        saldoCuentasBinance: 20500000,
        proveedores: 3000450,
        cuentasCop: 18000000
      }
    ];

    // asignar (orden descendente por fecha)
    this.balances = mock.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    console.log('Mock balances cargados', this.balances);
  }

  // ---- computeGains: saldo hoy - saldo ayer ----
  private computeGains(): void {
    this.gains = [];
    for (let i = 0; i < this.balances.length; i++) {
      const today = this.balances[i];
      const yesterday = this.balances[i + 1];
      const saldoToday = (today?.saldo ?? 0);
      const saldoYesterday = (yesterday?.saldo ?? 0);
      this.gains[i] = saldoToday - saldoYesterday;
    }
    console.log('Gains computed', this.gains);
  }

  // obtener ganancia por índice (se usa desde la plantilla)
  getGain(index: number): number {
    return this.gains[index] ?? 0;
  }

  // suma las fuentes: cripto + clientes + proveedores + cuentasCop + cajas
  getCardTotal(b: BalanceGeneral): number {
    const cripto = (b.saldoCuentasBinance ?? 0);
    const clientes = (b.clientesSaldo ?? 0);
    const proveedores = (b.proveedores ?? 0);
    const cuentasCop = (b.cuentasCop ?? 0);
    const cajas = (b.saldoCajas ?? 0);
    return cripto + clientes + proveedores + cuentasCop + cajas;
  }

  // Total agregado de todas las tarjetas (para top mini-card)
  get totalAggregate(): number {
    return this.balances.reduce((acc, b) => acc + this.getCardTotal(b), 0);
  }

  // Al pulsar la lupa: prepara detalle y abre el modal
  prepareDetail(b: BalanceGeneral): void {
    this.selectedBalance = b;
    const ventasTotal = (b.totalVentasGeneralesDelDia ?? 0);
    const ventasUtilidad = (b.utilidadVentasGenerales ?? 0);
    const p2pTotal = (b.totalP2PdelDia ?? 0);
    const p2pComisiones = (b.comisionesP2PdelDia ?? 0);
    const p2pUtilidad = (b.utilidadP2P ?? 0);
    const cuatroPorMil = (b.cuatroPorMilDeVentas ?? 0);
    const comisionTrust = (b.comisionTrust ?? 0);

    // Valores que no tiene BalanceGeneral por defecto quedan en 0.
    const retiros = 0;
    const traslado = 0;
    const pagosProveedor = (b.proveedores ?? 0);
    const trx = 0;
    const reintegroTrust = comisionTrust;
    const gastos = 0;
    const ajustes = 0;

    const comisionesTotal = p2pComisiones + cuatroPorMil + comisionTrust;

    const totalCalculado =
      ventasTotal + p2pTotal - comisionesTotal + reintegroTrust - (retiros + traslado + pagosProveedor + trx + gastos) + ajustes + this.getCardTotal(b);

    this.detail = {
      tasaProm: b.tasaPromedioDelDia ?? 0,
      ventas: {
        total: ventasTotal,
        comision: ventasUtilidad,
        cuatroPorMil: cuatroPorMil,
        utilidad: ventasUtilidad
      },
      p2p: {
        total: p2pTotal,
        comision: p2pComisiones,
        utilidad: p2pUtilidad
      },
      dec: {
        total: 0,
        comision: 0,
        utilidad: 0
      },
      comisionesTotal,
      retiros,
      traslado,
      pagosProveedor,
      trx,
      reintegroTrust,
      gastos,
      ajustes,
      totalCalculado
    };

    this.showDetailsModal = true;
  }

  showDetails(row: BalanceGeneral): void {
    this.prepareDetail(row);
  }

  showAdditionalInfo(): void {
    this.balanceService.totalCaja().subscribe({
      next: (data) => {
        this.totalCajaObj = data || {};
        this.totalCajaArr = Object.entries(this.totalCajaObj).map(([nombre, monto]) => ({
          nombre,
          monto: Number(monto ?? 0)
        }));
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

  // Stub para sincronizar una tarjeta (puedes implementar llamada real más adelante)
  syncCard(b: BalanceGeneral): void {
    console.log('Sincronizar tarjeta (stub):', b.id ?? b.date);
  }
}