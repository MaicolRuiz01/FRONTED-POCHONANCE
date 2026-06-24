import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputSwitchModule } from 'primeng/inputswitch';
import { MultiSelectModule } from 'primeng/multiselect';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { SaleP2PService, SaleP2PDto } from '../../../../core/services/sale-p2p.service';
import { AccountCopService, AccountCop } from '../../../../core/services/account-cop.service';
import { AccountBinanceService, AccountBinance } from '../../../../core/services/account-binance.service';
import { P2PSseService } from '../../../../core/services/p2p-sse.service';
import { NotificationService } from '../../../../core/services/notification.service';

type BankType = 'NEQUI' | 'DAVIPLATA' | 'BANCOLOMBIA';

@Component({
  selector: 'app-ventas-pendientes',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, ButtonModule, DialogModule,
    DropdownModule, InputNumberModule, InputSwitchModule, MultiSelectModule,
    ProgressSpinnerModule, TagModule, TooltipModule
  ],
  templateUrl: './ventas-pendientes.component.html'
})
export class VentasPendientesComponent implements OnInit, OnDestroy {
  @Output() sseRefresh = new EventEmitter<void>();

  ventas: SaleP2PDto[] = [];
  binanceAccounts: AccountBinance[] = [];
  selectedBinanceAccount: AccountBinance | null = null;
  cuentasTodas: AccountCop[] = [];
  cuentasFiltradas: AccountCop[] = [];
  loading = false;
  saving = false;

  // Dialog
  displayDialog = false;
  selectedSale: SaleP2PDto | null = null;
  selectedBankType: BankType | null = null;
  multiMode = false;
  selectedAccountSingle: AccountCop | null = null;
  selectedAccounts: AccountCop[] = [];
  selectedAssignments: { account: AccountCop; amount: number }[] = [];

  private sseSub: Subscription | null = null;

  constructor(
    private saleService: SaleP2PService,
    private accountCopService: AccountCopService,
    private binanceService: AccountBinanceService,
    private sseService: P2PSseService
  ,
    private notificationService: NotificationService
) {}

  ngOnInit(): void {
    this.loadBinanceAccounts();
    this.loadVentas();
    this.sseService.connect();
    this.sseSub = this.sseService.nuevaVenta$.subscribe(() => {
      this.loadVentas();
      this.sseRefresh.emit();
    });
  }

  ngOnDestroy(): void {
    this.sseSub?.unsubscribe();
  }

  loadBinanceAccounts(): void {
    this.binanceService.traerCuentas().subscribe({
      next: accs => this.binanceAccounts = accs.filter(a => a.tipo === 'BINANCE')
    });
  }

  loadVentas(): void {
    this.loading = true;
    const req$ = this.selectedBinanceAccount
      ? this.saleService.getTodayNoAsignadas(this.selectedBinanceAccount.name)
      : this.saleService.getTodayNoAsignadasAllAccounts();

    req$.pipe(finalize(() => this.loading = false)).subscribe({
      next: sales => this.ventas = this.formatSales(sales),
      error: () => this.ventas = []
    });
  }

  onAccountFilter(): void {
    this.loadVentas();
  }

  openAssignDialog(sale: SaleP2PDto): void {
    this.selectedSale = sale;
    this.displayDialog = true;
    this.saving = false;
    this.selectedBankType = null;
    this.multiMode = false;
    this.selectedAccountSingle = null;
    this.selectedAccounts = [];
    this.selectedAssignments = [];
    this.accountCopService.getAll().subscribe({
      next: c => { this.cuentasTodas = c ?? []; this.applyBankFilter(); }
    });
  }

  applyBankFilter(): void {
    this.cuentasFiltradas = !this.selectedBankType
      ? this.cuentasTodas
      : this.cuentasTodas.filter(c => c.bankType?.toUpperCase() === this.selectedBankType);
    const ids = new Set(this.cuentasFiltradas.map(c => c.id));
    this.selectedAccounts = this.selectedAccounts.filter(c => ids.has(c.id));
    this.onAccountsChange();
  }

  setBankFilter(type: BankType | null): void {
    this.selectedBankType = this.selectedBankType === type ? null : type;
    this.applyBankFilter();
  }

  onAccountSingleChange(): void {
    if (!this.selectedAccountSingle) { this.selectedAssignments = []; return; }
    this.selectedAssignments = [{ account: this.selectedAccountSingle, amount: Number(this.selectedSale?.pesosCop ?? 0) }];
    this.selectedAccounts = [this.selectedAccountSingle];
  }

  onAccountsChange(): void {
    const ventaCop = Number(this.selectedSale?.pesosCop ?? 0);
    const defaultAmount = this.selectedAccounts.length === 1 ? ventaCop : 0;
    this.selectedAssignments = this.selectedAccounts.map(account => {
      const existing = this.selectedAssignments.find(a => a.account.id === account.id);
      return { account, amount: existing ? existing.amount : defaultAmount };
    });
  }

  assign(): void {
    if (this.saving || !this.selectedSale) return;
    const accounts = this.multiMode
      ? (this.selectedAccounts ?? [])
      : (this.selectedAccountSingle ? [this.selectedAccountSingle] : []);
    if (!accounts.length) { this.notificationService.warn('Selecciona al menos una cuenta COP.'); return; }
    if (this.selectedAssignments.some(a => !a.amount || a.amount <= 0)) { this.notificationService.warn('Todos los montos deben ser > 0.'); return; }
    const total = this.selectedAssignments.reduce((s, a) => s + a.amount, 0);
    if (total > Number(this.selectedSale.pesosCop ?? 0)) { this.notificationService.warn('El total excede el monto de la venta.'); return; }

    this.saving = true;
    const payload = this.selectedAssignments.map(a => ({ amount: a.amount, nameAccount: a.account.name, accountCop: a.account.id ?? null }));
    this.saleService.assignAccounts(this.selectedSale.id, payload)
      .pipe(finalize(() => this.saving = false))
      .subscribe({
        next: () => {
          const id = this.selectedSale!.id;
          this.ventas = this.ventas.filter(s => s.id !== id);
          this.displayDialog = false;
        },
        error: () => this.notificationService.error('Error al asignar.')
      });
  }

  bankLogo(type?: string | null): string {
    switch ((type ?? '').toUpperCase()) {
      case 'NEQUI': return '/assets/layout/images/nequi.png';
      case 'DAVIPLATA': return '/assets/layout/images/daviplata.png';
      case 'BANCOLOMBIA': return '/assets/layout/images/bancolombia.png';
      default: return '/assets/layout/images/nequi.png';
    }
  }

  private formatSales(sales: SaleP2PDto[]): SaleP2PDto[] {
    const fmtCop = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 });
    const fmtUsd = new Intl.NumberFormat('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const fmtFull = new Intl.DateTimeFormat('es-CO', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false });
    const fmtTime = new Intl.DateTimeFormat('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false });
    const today = new Date();
    return (sales ?? []).slice().sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(s => {
      const d = new Date(s.date);
      const sameDay = d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
      return { ...s, dateFmt: sameDay ? fmtTime.format(d) : fmtFull.format(d), pesosCopFmt: fmtCop.format(s.pesosCop ?? 0), dollarsUsFmt: fmtUsd.format(s.dollarsUs ?? 0), commissionFmt: fmtUsd.format(s.commission ?? 0), tasaFmt: fmtCop.format(s.tasa ?? 0) };
    });
  }
}
