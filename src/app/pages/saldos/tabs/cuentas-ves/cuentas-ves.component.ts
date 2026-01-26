import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TableModule } from 'primeng/table';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { CompraVesDto } from '../../../../core/services/compra-ves.service';
import { VentaVesDto } from '../../../../core/services/venta-ves.service';
import { TabViewModule } from 'primeng/tabview';

import {
  AccountVesService,
  AccountVes,
  AccountVesCreate
} from '../../../../core/services/AccountVes.service';
import {
  VesAverageRateApiService,
  VesAverageRateDto
} from '../../../../core/services/ves-average-rate.service';

@Component({
  selector: 'app-cuentas-ves',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    InputNumberModule,
    TableModule,
    ProgressSpinnerModule,
    TabViewModule
  ],
  templateUrl: './cuentas-ves.component.html',
  styleUrl: './cuentas-ves.component.css'
})
export class CuentasVesComponent implements OnInit {

  cuentas: AccountVes[] = [];
  displayDialog = false;

  newAccount: AccountVesCreate = {
    name: '',
    balance: 0
  };

  // 👇 aquí guardamos la última tasa promedio
  tasaVesPromedio: number | null = null;
  displayMovsDialog = false;
  cuentaSeleccionada: AccountVes | null = null;

  compras: CompraVesDto[] = [];
  ventas: VentaVesDto[] = [];

  loadingCompras = false;
  loadingVentas = false;

  constructor(
    private accountVesService: AccountVesService,
    private vesRateApi: VesAverageRateApiService
  ) {}

  ngOnInit(): void {
    this.loadCuentas();
    this.loadTasaVesPromedio();
  }

  loadCuentas(): void {
    this.accountVesService.getAll().subscribe({
      next: cuentas => this.cuentas = cuentas,
      error: () => alert('Error al cargar cuentas VES')
    });
  }

  private loadTasaVesPromedio(): void {
    this.vesRateApi.getUltima().subscribe({
      next: (rate: VesAverageRateDto | null) => {
        // si hay registro tomamos tasaPromedioDia, si no, null
        this.tasaVesPromedio = rate ? rate.tasaPromedioDia : null;
      },
      error: (err) => {
        console.error('Error cargando tasa promedio VES', err);
        this.tasaVesPromedio = null;
      }
    });
  }

  get totalCuentas(): number {
    return this.cuentas.reduce((acc, c) => acc + (c.balance || 0), 0);
  }

  abrirDialogCrear(): void {
    this.newAccount = { name: '', balance: 0 };
    this.displayDialog = true;
  }

  crearCuenta(): void {
    if (!this.newAccount.name || this.newAccount.balance == null) {
      alert('Nombre y balance son obligatorios');
      return;
    }

    this.accountVesService.create(this.newAccount).subscribe({
      next: () => {
        this.displayDialog = false;
        this.loadCuentas();
      },
      error: () => alert('Error al crear cuenta VES')
    });
  }
  abrirDialogMovs(cuenta: AccountVes) {
    this.cuentaSeleccionada = cuenta;
    this.displayMovsDialog = true;

    this.compras = [];
    this.ventas = [];

    if (!cuenta.id) return;

    this.loadingCompras = true;
    this.accountVesService.getCompras(cuenta.id).subscribe({
      next: data => this.compras = data,
      error: err => console.error('Error cargando compras', err),
      complete: () => this.loadingCompras = false
    });

    this.loadingVentas = true;
    this.accountVesService.getVentas(cuenta.id).subscribe({
      next: data => this.ventas = data,
      error: err => console.error('Error cargando ventas', err),
      complete: () => this.loadingVentas = false
    });
  }

}
