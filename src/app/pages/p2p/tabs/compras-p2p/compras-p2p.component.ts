import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { finalize } from 'rxjs/operators';

import { BuyP2PService, BuyP2PDto } from '../../../../core/services/buy-p2p.service';
import { AccountBinanceService, AccountBinance } from '../../../../core/services/account-binance.service';

@Component({
  selector: 'app-compras-p2p',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, ButtonModule, DropdownModule, ProgressSpinnerModule],
  templateUrl: './compras-p2p.component.html'
})
export class ComprasP2pComponent implements OnInit {
  compras: BuyP2PDto[] = [];
  binanceAccounts: AccountBinance[] = [];
  selectedBinanceAccount: AccountBinance | null = null;
  loading = false;

  constructor(
    private buyService: BuyP2PService,
    private binanceService: AccountBinanceService
  ) {}

  ngOnInit(): void {
    this.binanceService.traerCuentas().subscribe({
      next: accs => this.binanceAccounts = accs.filter(a => a.tipo === 'BINANCE')
    });
    this.loadCompras();
  }

  loadCompras(): void {
    this.loading = true;
    const req$ = this.selectedBinanceAccount
      ? this.buyService.getTodayNoAsignadas(this.selectedBinanceAccount.name)
      : this.buyService.getTodayNoAsignadasAllAccounts();

    req$.pipe(finalize(() => this.loading = false)).subscribe({
      next: compras => this.compras = this.formatCompras(compras),
      error: () => this.compras = []
    });
  }

  onAccountFilter(): void { this.loadCompras(); }

  private formatCompras(compras: BuyP2PDto[]): BuyP2PDto[] {
    const fmtCop = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 });
    const fmtUsd = new Intl.NumberFormat('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const fmtFull = new Intl.DateTimeFormat('es-CO', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false });
    const fmtTime = new Intl.DateTimeFormat('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false });
    const today = new Date();
    return (compras ?? []).slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(s => {
      const d = new Date(s.date);
      const sameDay = d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
      return { ...s, dateFmt: sameDay ? fmtTime.format(d) : fmtFull.format(d), pesosCopFmt: fmtCop.format(s.pesosCop ?? 0), dollarsUsFmt: fmtUsd.format(s.dollarsUs ?? 0), tasaFmt: fmtCop.format(s.tasa ?? 0) } as any;
    });
  }
}
