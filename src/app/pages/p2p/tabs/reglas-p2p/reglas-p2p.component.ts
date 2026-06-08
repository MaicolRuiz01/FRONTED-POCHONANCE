import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { finalize } from 'rxjs/operators';

import { P2PAssignmentRuleService, P2PAssignmentRule } from '../../../../core/services/p2p-assignment-rule.service';
import { AccountCopService, AccountCop } from '../../../../core/services/account-cop.service';
import { AccountBinanceService, AccountBinance } from '../../../../core/services/account-binance.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-reglas-p2p',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, ButtonModule, DialogModule,
    DropdownModule, ProgressSpinnerModule, TagModule, TooltipModule
  ],
  templateUrl: './reglas-p2p.component.html',
  styleUrls: ['./reglas-p2p.component.css']
})
export class ReglasP2pComponent implements OnInit {
  reglas: P2PAssignmentRule[] = [];
  binanceAccounts: AccountBinance[] = [];
  cuentasCop: AccountCop[] = [];
  loading = false;
  saving = false;

  // Dialog nueva regla / editar
  displayDialog = false;
  selectedBinanceAccount: AccountBinance | null = null;
  selectedCopAccount: AccountCop | null = null;
  editingAccount: string | null = null;
  bankFilter: 'BANCOLOMBIA' | 'NEQUI' | null = null;

  constructor(
    private ruleService: P2PAssignmentRuleService,
    private binanceService: AccountBinanceService,
    private copService: AccountCopService
  ,
    private notificationService: NotificationService
) {}

  ngOnInit(): void {
    this.loadAll();
    this.binanceService.traerCuentas().subscribe({ next: accs => this.binanceAccounts = accs.filter(a => a.tipo === 'BINANCE') });
    this.copService.getAll().subscribe({ next: c => this.cuentasCop = c ?? [] });
  }

  loadAll(): void {
    this.loading = true;
    this.ruleService.getAllRules().pipe(finalize(() => this.loading = false)).subscribe({
      next: r => this.reglas = r ?? [],
      error: () => this.reglas = []
    });
  }

  openNewDialog(): void {
    this.editingAccount = null;
    this.selectedBinanceAccount = null;
    this.selectedCopAccount = null;
    this.bankFilter = null;
    this.displayDialog = true;
  }

  get filteredCopAccounts(): AccountCop[] {
    if (!this.bankFilter) return [];
    return this.cuentasCop.filter(c => c.bankType === this.bankFilter);
  }

  setBankFilter(bank: 'BANCOLOMBIA' | 'NEQUI'): void {
    this.bankFilter = bank;
    this.selectedCopAccount = null;
  }

  // ─── Helpers para acceder a los campos anidados del backend ───

  binanceName(regla: P2PAssignmentRule): string {
    return regla.binanceAccount?.name ?? '—';
  }

  copName(regla: P2PAssignmentRule): string {
    return regla.copAccount?.name ?? '—';
  }

  copBalance(regla: P2PAssignmentRule): number {
    return regla.copAccount?.balance ?? 0;
  }

  // ──────────────────────────────────────────────────────────────

  openEditDialog(regla: P2PAssignmentRule): void {
    const bName = this.binanceName(regla);
    const cName = this.copName(regla);
    this.editingAccount = bName;
    this.selectedBinanceAccount = this.binanceAccounts.find(a => a.name === bName) ?? null;
    this.selectedCopAccount = this.cuentasCop.find(c => c.name === cName) ?? null;
    this.displayDialog = true;
  }

  saveRule(): void {
    if (this.saving || !this.selectedBinanceAccount || !this.selectedCopAccount?.id) return;
    this.saving = true;
    this.ruleService.setRule({ binanceAccount: this.selectedBinanceAccount.name, copAccountId: this.selectedCopAccount.id! })
      .pipe(finalize(() => this.saving = false))
      .subscribe({
        next: () => { this.displayDialog = false; this.loadAll(); },
        error: () => this.notificationService.error('Error al guardar la regla.')
      });
  }

  pauseRule(regla: P2PAssignmentRule): void {
    this.ruleService.pauseRule(this.binanceName(regla)).subscribe({ next: () => this.loadAll() });
  }

  resumeRule(regla: P2PAssignmentRule): void {
    this.ruleService.resumeRule(this.binanceName(regla)).subscribe({ next: () => this.loadAll() });
  }

  deleteRule(regla: P2PAssignmentRule): void {
    const name = this.binanceName(regla);
    if (!confirm(`¿Eliminar regla para ${name}?`)) return;
    this.ruleService.deleteRule(name).subscribe({ next: () => this.loadAll() });
  }

  getAvailableBinanceAccounts(): AccountBinance[] {
    if (this.editingAccount) return this.binanceAccounts;
    const usados = new Set(this.reglas.map(r => this.binanceName(r)));
    return this.binanceAccounts.filter(a => !usados.has(a.name));
  }
}
