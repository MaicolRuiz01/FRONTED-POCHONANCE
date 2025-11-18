// lista-ventas.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TabViewModule } from 'primeng/tabview'; // ⬅️ nuevo
import { ActivatedRoute, Router } from '@angular/router';

import { AccountCopService } from '../../../../../core/services/account-cop.service';
import { SaleP2PDto } from '../../../../../core/services/sale-p2p.service';
import { MovimientoService, MovimientoVistaDto, MovimientoVistaCuentaCopDto } from '../../../../../core/services/movimiento.service';

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
  movimientosSalidas:  MovimientoVistaCuentaCopDto[] = [];

  constructor(
    private route: ActivatedRoute,
    private accountCopService: AccountCopService,
    private movService: MovimientoService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.accountId = Number(this.route.snapshot.paramMap.get('id'));
    if (!this.accountId) return;

    this.cargarVentas();
    // Si prefieres lazy load, comenta esta línea y deja onTabChange
    this.cargarMovimientos();
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
        this.movimientosSalidas  = movs.filter(m => m.salida);
        this.loadingMovs = false;
      },
      error: (err) => {
        console.error('Error al cargar movimientos', err);
        this.loadingMovs = false;
      }
    });
  }

  onTabChange(e: any) {
    // index 1 = pestaña Movimientos
    if (e.index === 1 && !this.loadingMovs 
        && this.movimientosEntradas.length === 0 
        && this.movimientosSalidas.length === 0) {
      this.cargarMovimientos();
    }
  }

  goBack(): void {
    this.router.navigate(['/saldos'], { queryParams: { tab: 'cuentas-cop' } });
  }
}
