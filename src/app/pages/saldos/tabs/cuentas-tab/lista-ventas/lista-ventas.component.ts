// lista-ventas.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TabViewModule } from 'primeng/tabview';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { AccountCopService, CompraP2PCuenta } from '../../../../../core/services/account-cop.service';
import { SaleP2PDto } from '../../../../../core/services/sale-p2p.service';
import { MovimientoService, MovimientoVistaCuentaCopDto, MovimientoAjusteDto } from '../../../../../core/services/movimiento.service';

@Component({
  selector: 'app-lista-ventas',
  standalone: true,
  imports: [CommonModule, FormsModule, InputTextModule, TableModule, CardModule, ButtonModule, TabViewModule, TagModule, ProgressSpinnerModule],
  templateUrl: './lista-ventas.component.html',
  styleUrls: ['./lista-ventas.component.css']
})
export class ListaVentasComponent implements OnInit {
  accountId!: number;
  accountName = '';
  saldo = 0;

  // Datos por sección
  ventas: SaleP2PDto[] = [];
  compras: CompraP2PCuenta[] = [];
  movs: MovimientoVistaCuentaCopDto[] = [];
  ajustes: MovimientoAjusteDto[] = [];

  // Estados de carga (para carga perezosa por pestaña → rápido)
  loadingVentas = false;
  loadingCompras = false; comprasLoaded = false;
  loadingMovs = false;    movsLoaded = false;
  loadingAjustes = false; ajustesLoaded = false;

  // ── Búsqueda por número de orden (Ventas y Compras P2P) ──
  /** Texto buscado: basta con un pedazo del número (p. ej. los últimos dígitos). */
  busquedaOrden = '';

  private coincide(numero?: string | null): boolean {
    const q = this.busquedaOrden.replace(/\s+/g, '');
    return !q || (numero ?? '').includes(q);
  }
  get ventasFiltradas(): SaleP2PDto[] { return this.ventas.filter(v => this.coincide(v.numberOrder)); }
  get comprasFiltradas(): CompraP2PCuenta[] { return this.compras.filter(c => this.coincide(c.numberOrder)); }

  // ── Resumen de ventas (sobre la lista filtrada) ──
  private esHoy(fecha: any): boolean {
    const d = new Date(fecha), h = new Date();
    return d.getFullYear() === h.getFullYear() && d.getMonth() === h.getMonth() && d.getDate() === h.getDate();
  }
  get totalVentasCop(): number { return this.ventasFiltradas.reduce((t, v) => t + (Number(v.pesosCop) || 0), 0); }
  get ventasHoy(): SaleP2PDto[] { return this.ventasFiltradas.filter(v => this.esHoy(v.date)); }
  get totalVentasHoyCop(): number { return this.ventasHoy.reduce((t, v) => t + (Number(v.pesosCop) || 0), 0); }

  // ── Copiar número de orden (sin toast: el ícono pasa a ✓ un momento) ──
  ordenCopiada: string | null = null;
  private ordenCopiadaTimer?: ReturnType<typeof setTimeout>;

  async copiarOrden(numero: string | undefined | null, event?: Event): Promise<void> {
    event?.stopPropagation();
    if (!numero) return;
    try {
      await navigator.clipboard.writeText(numero);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = numero;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } finally { document.body.removeChild(ta); }
    }
    this.ordenCopiada = numero;
    clearTimeout(this.ordenCopiadaTimer);
    this.ordenCopiadaTimer = setTimeout(() => this.ordenCopiada = null, 1500);
  }

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
    this.cargarVentas(); // primera pestaña
  }

  // ── Derivados de la vista de movimientos (una sola llamada) ──
  get entradas() { return this.movs.filter(m => m.entrada); }
  get salidas()  { return this.movs.filter(m => m.salida); }
  get retiros()  { return this.movs.filter(m => (m.tipo || '').toUpperCase().startsWith('RETIRO')); }
  get traspasos(){ return this.movs.filter(m => (m.tipo || '').toUpperCase() === 'TRANSFERENCIA'); }

  cargarCuenta(): void {
    this.accountCopService.getById(this.accountId).subscribe({
      next: (c) => { this.accountName = c.name; this.saldo = c.balance; },
      error: () => { this.accountName = 'Cuenta desconocida'; }
    });
  }

  cargarVentas(): void {
    this.loadingVentas = true;
    this.accountCopService.getSalesByAccountCopId(this.accountId).subscribe({
      next: (v) => {
        // 16/09/2026: el backend devuelve las ventas en orden ascendente (más
        // vieja primero) — sin este sort, la página 1 del paginador mostraba
        // las ventas más antiguas y había que navegar hasta la última página
        // para ver las de hoy. Mismo criterio que ya usan cargarMovimientos()/
        // cargarAjustes() más abajo.
        this.ventas = (v ?? []).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        this.loadingVentas = false;
      },
      error: () => { this.loadingVentas = false; }
    });
  }

  cargarCompras(): void {
    if (this.comprasLoaded || this.loadingCompras) return;
    this.loadingCompras = true;
    this.accountCopService.getComprasP2PByAccountCopId(this.accountId).subscribe({
      next: (c) => {
        this.compras = (c ?? []).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        this.comprasLoaded = true; this.loadingCompras = false;
      },
      error: () => { this.loadingCompras = false; }
    });
  }

  cargarMovimientos(): void {
    if (this.movsLoaded || this.loadingMovs) return;
    this.loadingMovs = true;
    this.movService.getVistaCuentaCop(this.accountId).subscribe({
      next: (m) => {
        this.movs = (m ?? []).sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
        this.movsLoaded = true; this.loadingMovs = false;
      },
      error: () => { this.loadingMovs = false; }
    });
  }

  cargarAjustes(): void {
    if (this.ajustesLoaded || this.loadingAjustes) return;
    this.loadingAjustes = true;
    this.movService.getAjustesCuentaCop(this.accountId).subscribe({
      next: (a) => {
        this.ajustes = (a ?? []).sort((x, y) => new Date(y.fecha).getTime() - new Date(x.fecha).getTime());
        this.ajustesLoaded = true; this.loadingAjustes = false;
      },
      error: () => { this.loadingAjustes = false; }
    });
  }

  // Índices: 0 Ventas · 1 Compras · 2 Retiros · 3 Traspasos · 4 Entradas · 5 Salidas · 6 Ajustes
  onTabChange(e: any): void {
    const i = e.index;
    if (i === 1) this.cargarCompras();
    else if (i >= 2 && i <= 5) this.cargarMovimientos();
    else if (i === 6) this.cargarAjustes();
  }

  tipoSeverity(tipo: string): 'success' | 'danger' | 'info' | 'warning' | 'secondary' {
    const t = (tipo || '').toUpperCase();
    if (t.startsWith('RETIRO')) return 'danger';
    if (t === 'TRANSFERENCIA') return 'warning';
    if (t === 'DEPOSITO') return 'success';
    if (t.startsWith('PAGO')) return 'info';
    return 'secondary';
  }

  goBack(): void {
    this.router.navigate(['/saldos'], { queryParams: { tab: 'cuentas-cop' } });
  }
}
