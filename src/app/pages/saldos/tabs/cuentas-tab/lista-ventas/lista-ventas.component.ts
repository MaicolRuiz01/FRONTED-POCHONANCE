// lista-ventas.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TabViewModule } from 'primeng/tabview';
import { ActivatedRoute, Router } from '@angular/router';

import { AccountCopService } from '../../../../../core/services/account-cop.service';
import { SaleP2PDto } from '../../../../../core/services/sale-p2p.service';
import { MovimientoService, MovimientoVistaDto, MovimientoVistaCuentaCopDto, MovimientoAjusteDto } from '../../../../../core/services/movimiento.service';

@Component({
  selector: 'app-lista-ventas',
  standalone: true,
  imports: [CommonModule, TableModule, CardModule, ButtonModule, TabViewModule],
  templateUrl: './lista-ventas.component.html',
  styleUrls: ['./lista-ventas.component.css']
})
export class ListaVentasComponent implements OnInit {
  accountId!: number;

  ventas: SaleP2PDto[] = [];
  movimientos: MovimientoVistaDto[] = [];

  loadingVentas = false;
  loadingMovs = false;

  movimientosEntradas: MovimientoVistaCuentaCopDto[] = [];
  movimientosSalidas: MovimientoVistaCuentaCopDto[] = [];

  ajustesCuenta: MovimientoAjusteDto[] = [];
  loadingAjustes = false;
  accountName: string = '';
  saldo: number = 0;


  constructor(
    private route: ActivatedRoute,
    private accountCopService: AccountCopService,
    private movService: MovimientoService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.accountId = Number(this.route.snapshot.paramMap.get('id'));
    if (!this.accountId) return;
    this.cargarCuenta();
    this.cargarVentas();
    this.cargarMovimientos();
  }
  cargarCuenta(): void {
    this.accountCopService.getById(this.accountId).subscribe({
      next: (cuenta) => {
        this.accountName = cuenta.name;
        this.saldo = cuenta.balance;
      },
      error: (err) => {
        console.error('Error al cargar la cuenta', err);
        this.accountName = 'Cuenta desconocida';
      }
    });
  }


  cargarVentas(): void {
    this.loadingVentas = true;
    this.accountCopService.getSalesByAccountCopId(this.accountId).subscribe({
      next: (ventas) => { this.ventas = ventas; this.loadingVentas = false; },
      error: (err) => { console.error('Error al cargar ventas', err); this.loadingVentas = false; }
    });
  }

  cargarMovimientos(): void {
    this.loadingMovs = true;
    this.movService.getVistaCuentaCop(this.accountId).subscribe({
      next: (movs) => {
        this.movimientosEntradas = movs.filter(m => m.entrada);
        this.movimientosSalidas = movs.filter(m => m.salida);
        this.loadingMovs = false;
      },
      error: (err) => {
        console.error('Error al cargar movimientos', err);
        this.loadingMovs = false;
      }
    });
  }

  onTabChange(e: any) {
    // Si entra a Entradas o Salidas (1 o 2), cargamos movimientos si aún no están
    if ((e.index === 1 || e.index === 2) &&
      !this.loadingMovs &&
      this.movimientosEntradas.length === 0 &&
      this.movimientosSalidas.length === 0) {
      this.cargarMovimientos();
    }

    // Si entra a Ajustes (3), cargamos ajustes si hace falta
    if (e.index === 3 &&
      !this.loadingAjustes &&
      this.ajustesCuenta.length === 0) {
      this.cargarAjustes();
    }
  }


  cargarAjustes(): void {
    this.loadingAjustes = true;
    this.movService.getAjustesCuentaCop(this.accountId).subscribe({
      next: (ajustes) => {
        this.ajustesCuenta = [...ajustes].sort(
          (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
        );
        this.loadingAjustes = false;
      },
      error: (err) => {
        console.error('Error al cargar ajustes de cuenta COP', err);
        this.loadingAjustes = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/saldos'], { queryParams: { tab: 'cuentas-cop' } });
  }
}
