import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';

import { TabViewModule } from 'primeng/tabview';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { RadioButtonModule } from 'primeng/radiobutton';
import { TooltipModule } from 'primeng/tooltip';
import { SelectButtonModule } from 'primeng/selectbutton';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { BuyDollarsDto, BuyDollarsService } from '../../../core/services/buy-dollars.service';
import { SellDollar, SellDollarsService } from '../../../core/services/sell-dollars.service';
import { SupplierService, Supplier } from '../../../core/services/supplier.service';
import { ClienteService, Cliente } from '../../../core/services/cliente.service';
import { AccountCopService, AccountCop } from '../../../core/services/account-cop.service';
import { NotificationService } from '../../../core/services/notification.service';

import { VentasAsignadasComponent } from '../../p2p/tabs/ventas-asignadas/ventas-asignadas.component';
import { ComprasP2pComponent } from '../../p2p/tabs/compras-p2p/compras-p2p.component';

/** Fila unificada de la tabla Compras/Ventas asignadas. */
interface AsignadaRow {
  tipoOp: 'COMPRA' | 'VENTA';
  id: number;
  date: Date;
  nameAccount: string;
  dolares: number;
  tasa: number;
  pesos: number;
  contraparte: string;
  raw: any;
}

@Component({
  selector: 'app-asignadas',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TabViewModule,
    TableModule,
    ButtonModule,
    DialogModule,
    DropdownModule,
    InputNumberModule,
    RadioButtonModule,
    TooltipModule,
    SelectButtonModule,
    ToastModule,
    VentasAsignadasComponent,
    ComprasP2pComponent,
  ],
  templateUrl: './asignadas.component.html',
  styleUrls: ['./asignadas.component.css'],
  providers: [MessageService],
})
export class AsignadasComponent implements OnInit {
  // ---- Datos base ----
  compras: BuyDollarsDto[] = [];
  ventas: SellDollar[] = [];
  filas: AsignadaRow[] = [];
  loading = false;

  clientesMap = new Map<number, string>();
  suppliersMap = new Map<number, string>();
  clientes: Cliente[] = [];
  suppliers: Supplier[] = [];
  accountCops: any[] = [];

  // ---- Filtros Compras/Ventas ----
  filtroTipo: '' | 'COMPRA' | 'VENTA' = '';
  filtroContraparte: string = '';
  filtroDesde: string = '';
  filtroHasta: string = '';

  // ---- Sub-vista P2P (Ventas / Compras) ----
  p2pVista: 'VENTAS' | 'COMPRAS' = 'VENTAS';
  p2pOpciones = [
    { label: 'Ventas P2P', value: 'VENTAS' },
    { label: 'Compras P2P', value: 'COMPRAS' },
  ];

  // ---- Edición compra ----
  dialogCompra = false;
  selectedCompra: BuyDollarsDto | null = null;

  // ---- Edición venta ----
  dialogVenta = false;
  editableSale: any = null;
  isSpecialClient = true;

  constructor(
    private buyService: BuyDollarsService,
    private sellService: SellDollarsService,
    private supplierService: SupplierService,
    private clienteService: ClienteService,
    private accountCopService: AccountCopService,
    private messageService: MessageService,
    private notificationService: NotificationService,
  ) {}

  ngOnInit(): void {
    this.clienteService.listar().subscribe(list => {
      this.clientes = list ?? [];
      this.clientesMap = new Map((list ?? []).map(c => [c.id, c.nombre]));
      this.rebuildFilas();
    });
    this.supplierService.getAllSuppliers().subscribe(list => {
      this.suppliers = list ?? [];
      this.suppliersMap = new Map((list ?? []).map(s => [s.id, s.name]));
      this.rebuildFilas();
    });
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    forkJoin({
      compras: this.buyService.getComprasRegistradas(),
      ventas: this.sellService.getSellDto(),
    }).subscribe({
      next: ({ compras, ventas }) => {
        this.compras = compras ?? [];
        this.ventas = ventas ?? [];
        this.rebuildFilas();
        this.loading = false;
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se cargaron compras/ventas' });
        this.loading = false;
      },
    });
  }

  /** Construye la lista unificada a partir de compras + ventas. */
  private rebuildFilas(): void {
    const compraRows: AsignadaRow[] = (this.compras ?? []).map(c => ({
      tipoOp: 'COMPRA' as const,
      id: c.id ?? 0,
      date: c.date,
      nameAccount: c.nameAccount,
      dolares: c.amount,
      tasa: c.tasa,
      pesos: c.pesos,
      contraparte: c.clienteName || c.supplierName
        || (c.clienteId ? this.clientesMap.get(c.clienteId) : undefined)
        || (c.supplierId ? this.suppliersMap.get(c.supplierId) : undefined)
        || '—',
      raw: c,
    }));

    const ventaRows: AsignadaRow[] = (this.ventas ?? []).map(v => ({
      tipoOp: 'VENTA' as const,
      id: v.id,
      date: v.date,
      nameAccount: v.nameAccount,
      dolares: v.dollars,
      tasa: v.tasa,
      pesos: v.pesos,
      contraparte: (v.clienteId ? this.clientesMap.get(v.clienteId) : undefined)
        || (v.supplier ? this.suppliersMap.get(v.supplier) : undefined)
        || '—',
      raw: v,
    }));

    this.filas = [...compraRows, ...ventaRows]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  /** Contrapartes distintas presentes (para el filtro). */
  get contrapartesDisponibles(): string[] {
    const set = new Set<string>();
    this.filas.forEach(f => { if (f.contraparte && f.contraparte !== '—') set.add(f.contraparte); });
    return Array.from(set).sort();
  }

  /** Filas tras aplicar los filtros activos. */
  get filasFiltradas(): AsignadaRow[] {
    const desde = this.filtroDesde ? new Date(this.filtroDesde + 'T00:00:00') : null;
    const hasta = this.filtroHasta ? new Date(this.filtroHasta + 'T23:59:59') : null;
    return this.filas.filter(f => {
      const d = new Date(f.date);
      if (this.filtroTipo && f.tipoOp !== this.filtroTipo) return false;
      if (this.filtroContraparte && f.contraparte !== this.filtroContraparte) return false;
      if (desde && d < desde) return false;
      if (hasta && d > hasta) return false;
      return true;
    });
  }

  limpiarFiltros(): void {
    this.filtroTipo = '';
    this.filtroContraparte = '';
    this.filtroDesde = '';
    this.filtroHasta = '';
  }

  // ============ Edición ============

  editarFila(fila: AsignadaRow): void {
    if (fila.tipoOp === 'COMPRA') this.editCompra(fila.raw);
    else this.editSale(fila.raw);
  }

  // ---- Compra ----
  editCompra(compra: BuyDollarsDto): void {
    this.selectedCompra = { ...compra };
    this.dialogCompra = true;
  }

  recalcPesosCompra(): void {
    if (this.selectedCompra?.amount != null && this.selectedCompra?.tasa != null) {
      this.selectedCompra.pesos = this.selectedCompra.amount * this.selectedCompra.tasa;
    }
  }

  saveCompra(): void {
    if (!this.selectedCompra?.id) return;
    this.buyService.updateBuyDollar(this.selectedCompra.id, this.selectedCompra).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Actualizado', detail: 'Compra actualizada' });
        this.dialogCompra = false;
        this.loadData();
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar' }),
    });
  }

  // ---- Venta ----
  editSale(sale: SellDollar): void {
    if (!confirm('¿Editar esta venta? Esto revertirá los saldos previos.')) return;
    this.editableSale = JSON.parse(JSON.stringify(sale));
    this.isSpecialClient = !!sale.clienteId;
    this.dialogVenta = true;
    this.accountCopService.getP2PView().subscribe({
      next: (data: AccountCop[]) => this.accountCops = (data ?? []).filter(c => c.name),
    });
  }

  addAccountField(): void {
    if (!this.editableSale.accounts) this.editableSale.accounts = [];
    this.editableSale.accounts.push({
      accountCop: this.accountCops.length > 0 ? this.accountCops[0].id : null,
      amount: 0,
    });
  }

  saveVenta(): void {
    if (!this.editableSale || typeof this.editableSale.id !== 'number') return;
    const payload: any = {
      id: this.editableSale.id,
      tasa: this.editableSale.tasa,
      dollars: this.editableSale.dollars,
      pesos: this.editableSale.dollars * this.editableSale.tasa,
      accounts: this.editableSale.accounts || [],
    };
    if (this.isSpecialClient) payload.clienteId = this.editableSale.clienteId!;
    else payload.supplier = this.editableSale.supplier!;

    this.sellService.updateSellDollar(payload.id, payload).subscribe({
      next: () => {
        this.notificationService.success('Venta actualizada exitosamente');
        this.dialogVenta = false;
        this.loadData();
      },
      error: () => this.notificationService.error('Hubo un error actualizando la venta'),
    });
  }
}
