import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { finalize } from 'rxjs/operators';

import { SaleP2PService, SaleP2PDto } from '../../../../core/services/sale-p2p.service';
import { AccountCopService, AccountCop } from '../../../../core/services/account-cop.service';
import { P2PAssignmentRuleService } from '../../../../core/services/p2p-assignment-rule.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-ventas-asignadas',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, ButtonModule, DialogModule,
    DropdownModule, CalendarModule, ProgressSpinnerModule, TagModule, TooltipModule
  ],
  templateUrl: './ventas-asignadas.component.html'
})
export class VentasAsignadasComponent implements OnInit {
  ventas: SaleP2PDto[] = [];
  cuentasCop: AccountCop[] = [];
  loading = false;
  saving = false;
  totalUsd = '0.00';
  totalCop = '0';

  fechaInicio: Date = new Date();
  fechaFin: Date = new Date();

  displayDialog = false;
  selectedSale: SaleP2PDto | null = null;
  selectedCopAccount: AccountCop | null = null;

  /** Filtro por cuenta COP (nombre) para la tabla de asignadas. null = todas. */
  filtroCop: string | null = null;

  constructor(
    private saleService: SaleP2PService,
    private accountCopService: AccountCopService,
    private ruleService: P2PAssignmentRuleService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadVentas();
    this.accountCopService.getAll().subscribe({ next: c => this.cuentasCop = c ?? [] });
  }

  loadVentas(): void {
    this.loading = true;
    const inicio = this.toIsoDate(this.fechaInicio);
    const fin = this.toIsoDate(this.fechaFin);
    this.saleService.getAsignadasByRange(inicio, fin)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: sales => {
          this.ventas = this.formatSales(sales);
          const fmtCop = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 });
          const fmtUsd = new Intl.NumberFormat('es-CO', { minimumFractionDigits: 2, maxFractionDigits: 2 } as any);
          this.totalUsd = this.ventas.reduce((s, v) => s + (v.dollarsUs ?? 0), 0).toFixed(2);
          this.totalCop = fmtCop.format(this.ventas.reduce((s, v) => s + (v.pesosCop ?? 0), 0));
        },
        error: () => { this.ventas = []; this.totalUsd = '0.00'; this.totalCop = '0'; }
      });
  }

  openReassignDialog(sale: SaleP2PDto): void {
    this.selectedSale = sale;
    this.selectedCopAccount = null;
    this.displayDialog = true;
  }

  reassign(): void {
    if (this.saving || !this.selectedSale || !this.selectedCopAccount?.id) return;
    this.saving = true;
    this.ruleService.reassignSale(this.selectedSale.id, this.selectedCopAccount.id!)
      .pipe(finalize(() => this.saving = false))
      .subscribe({
        next: () => { this.displayDialog = false; this.loadVentas(); },
        error: () => this.notificationService.error('Error al reasignar.')
      });
  }

  getCuentasAsignadas(sale: SaleP2PDto): string {
    if (!sale.accountCopsDetails?.length) return '—';
    return sale.accountCopsDetails.map(d => d.nameAccount).join(', ');
  }

  /** Nombres de cuenta COP presentes en las ventas cargadas (para el filtro). */
  get cuentasEnLista(): string[] {
    const set = new Set<string>();
    for (const v of this.ventas) {
      (v.accountCopsDetails ?? []).forEach(d => { if (d.nameAccount) set.add(d.nameAccount); });
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }

  /** Ventas filtradas por la cuenta COP seleccionada (o todas). */
  get ventasFiltradas(): SaleP2PDto[] {
    if (!this.filtroCop) return this.ventas;
    return this.ventas.filter(v =>
      (v.accountCopsDetails ?? []).some(d => d.nameAccount === this.filtroCop));
  }

  get totalUsdFiltrado(): string {
    return this.ventasFiltradas.reduce((s, v) => s + (v.dollarsUs ?? 0), 0).toFixed(2);
  }

  get totalCopFiltrado(): string {
    const fmt = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 });
    return fmt.format(this.ventasFiltradas.reduce((s, v) => s + (v.pesosCop ?? 0), 0));
  }

  private toIsoDate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private formatSales(sales: SaleP2PDto[]): SaleP2PDto[] {
    const fmtCop = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 });
    const fmtUsd = new Intl.NumberFormat('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const fmtFull = new Intl.DateTimeFormat('es-CO', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false
    });
    return (sales ?? [])
      .slice()
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .map(s => ({
        ...s,
        dateFmt: fmtFull.format(new Date(s.date)),
        pesosCopFmt: fmtCop.format(s.pesosCop ?? 0),
        dollarsUsFmt: fmtUsd.format(s.dollarsUs ?? 0),
        tasaFmt: fmtCop.format(s.tasa ?? 0)
      }));
  }
}
