import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TabViewModule } from 'primeng/tabview';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { SelectButtonModule } from 'primeng/selectbutton';
import { DialogModule } from 'primeng/dialog';
import { MessageService } from 'primeng/api';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { VentasPendientesComponent } from './tabs/ventas-pendientes/ventas-pendientes.component';
import { VentasAsignadasComponent } from './tabs/ventas-asignadas/ventas-asignadas.component';
import { ComprasP2pComponent } from './tabs/compras-p2p/compras-p2p.component';
import { ReglasP2pComponent } from './tabs/reglas-p2p/reglas-p2p.component';
import { VentasEnCursoComponent } from './tabs/ventas-en-curso/ventas-en-curso.component';
import { P2PSyncService, P2PSyncState } from '../../core/services/p2p-sync.service';
import { AccountCopService, AccountCop, CupoTipoP2P } from '../../core/services/account-cop.service';

@Component({
  selector: 'app-p2p-wrapper',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TabViewModule,
    ButtonModule,
    TagModule,
    ToastModule,
    TooltipModule,
    SelectButtonModule,
    DialogModule,
    VentasPendientesComponent,
    VentasAsignadasComponent,
    ComprasP2pComponent,
    ReglasP2pComponent,
    VentasEnCursoComponent,
  ],
  providers: [MessageService],
  templateUrl: './p2p-wrapper.component.html',
  styleUrls: ['./p2p-wrapper.component.css']
})
export class P2PWrapperComponent implements OnInit, OnDestroy {
  syncStates: P2PSyncState[] = [];
  syncing = false;

  showCuentasModal = false;
  cuentasCop: AccountCop[] = [];
  loadingCuentas = false;
  togglingId: number | null = null;

  get cuentasActivasCount(): number {
    return this.cuentasCop.filter(c => c.activaParaP2P).length;
  }

  cupoTipoOpciones: { label: string; value: CupoTipoP2P }[] = [
    { label: 'Cajero', value: 'CAJERO' },
    { label: 'Corresponsal', value: 'CORRESPONSAL' },
    { label: 'Ambos', value: 'AMBOS' },
  ];

  // ── Filtro por tipo de cupo de retiro (modal Cuentas COP en P2P) ──
  filtroTipo: 'TODOS' | 'CAJERO' | 'CORRESPONSAL' = 'TODOS';
  filtroOpciones: { label: string; value: 'TODOS' | 'CAJERO' | 'CORRESPONSAL' }[] = [
    { label: 'Todos', value: 'TODOS' },
    { label: 'Cajero', value: 'CAJERO' },
    { label: 'Corresponsal', value: 'CORRESPONSAL' },
  ];

  // ── Filtro por banco (multi-seleccion; vacio = todos) ──
  bancosSeleccionados = new Set<string>();

  /** Cupo maximo del dia por banco (en miles, igual que CupoDiarioRules del backend). */
  private readonly cupoMax: Record<string, { cajero: number; corresponsal: number }> = {
    NEQUI:       { cajero: 2700, corresponsal: 5000 },
    BANCOLOMBIA: { cajero: 2700, corresponsal: 10000 },
    DAVIPLATA:   { cajero: 3000, corresponsal: 5000 },
  };

  /** Bancos soportados por la app (lista fija, siempre visibles en el filtro). */
  bancosDisponibles: { label: string; value: string }[] = [
    { label: 'Nequi', value: 'NEQUI' },
    { label: 'Daviplata', value: 'DAVIPLATA' },
    { label: 'Bancolombia', value: 'BANCOLOMBIA' },
  ];

  bancoActivo(bank: string): boolean {
    return this.bancosSeleccionados.has(bank);
  }

  toggleBanco(bank: string): void {
    if (this.bancosSeleccionados.has(bank)) this.bancosSeleccionados.delete(bank);
    else this.bancosSeleccionados.add(bank);
  }

  /**
   * Muestra el badge "Retirar" cuando el saldo alcanza para cubrir cajero +
   * corresponsal y ambos cupos siguen al maximo del dia (aun no se ha retirado).
   */
  puedeRetirar(c: AccountCop): boolean {
    const max = this.cupoMax[c.bankType];
    if (!max) return false;
    const cajeroDisp = c.cupoCajeroDisponibleHoy ?? 0;
    const corrDisp = c.cupoCorresponsalDisponibleHoy ?? 0;
    const sinRetirarHoy = cajeroDisp >= max.cajero && corrDisp >= max.corresponsal;
    const saldoCubre = (c.balance ?? 0) >= (max.cajero + max.corresponsal);
    return sinRetirarHoy && saldoCubre;
  }

  /**
   * Cuentas del modal: filtradas por tipo de cupo de retiro disponible,
   * por banco, y ordenadas de mayor a menor saldo.
   */
  get cuentasFiltradas(): AccountCop[] {
    return this.cuentasCop
      .filter(c => {
        if (this.filtroTipo === 'CAJERO') return (c.cupoCajeroDisponibleHoy ?? 0) > 0;
        if (this.filtroTipo === 'CORRESPONSAL') return (c.cupoCorresponsalDisponibleHoy ?? 0) > 0;
        return true;
      })
      .filter(c => this.bancosSeleccionados.size === 0 || this.bancosSeleccionados.has(c.bankType))
      .sort((a, b) => (b.balance ?? 0) - (a.balance ?? 0));
  }

  constructor(
    private syncService: P2PSyncService,
    private messageService: MessageService,
    private copService: AccountCopService
  ) {}

  private p2pSub?: Subscription;

  ngOnInit(): void {
    this.loadSyncStatus();
    this.loadCuentas();
    // Si otra vista cambia el estado P2P de una cuenta, recargamos para sincronizar
    this.p2pSub = this.copService.p2pCambio$.subscribe(() => this.loadCuentas());
  }

  ngOnDestroy(): void {
    this.p2pSub?.unsubscribe();
  }

  loadCuentas(): void {
    this.loadingCuentas = true;
    this.copService.getAll()
      .pipe(finalize(() => this.loadingCuentas = false))
      .subscribe({ next: c => this.cuentasCop = c ?? [] });
  }

  loadSyncStatus(): void {
    this.syncService.getSyncStatus().subscribe({
      next: states => this.syncStates = states ?? []
    });
  }

  triggerSync(): void {
    if (this.syncing) return;
    this.syncing = true;
    this.syncService.triggerSync()
      .pipe(finalize(() => this.syncing = false))
      .subscribe({
        next: result => {
          this.loadSyncStatus();
          this.messageService.add({
            severity: result.nuevasVentas > 0 ? 'success' : 'info',
            summary: 'Sincronizacion',
            detail: result.mensaje,
            life: 4000
          });
        },
        error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo sincronizar.' })
      });
  }

  toggleP2P(cuenta: AccountCop): void {
    if (!cuenta.id || this.togglingId === cuenta.id) return;
    this.togglingId = cuenta.id;
    this.copService.toggleActivaParaP2P(cuenta.id)
      .pipe(finalize(() => this.togglingId = null))
      .subscribe({
        next: updated => {
          cuenta.activaParaP2P = updated.activaParaP2P;
          this.copService.notificarCambioP2P();
          this.messageService.add({
            severity: 'success',
            summary: updated.activaParaP2P ? 'Cuenta activada' : 'Cuenta desactivada',
            detail: `${cuenta.name} ${updated.activaParaP2P ? 'incluida en' : 'excluida de'} P2P`,
            life: 2500
          });
        },
        error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar.' })
      });
  }

  setCupoTipo(cuenta: AccountCop, tipo: CupoTipoP2P): void {
    if (!cuenta.id) return;
    this.copService.setCupoTipo(cuenta.id, tipo).subscribe({
      next: updated => { cuenta.cupoTipoP2P = updated.cupoTipoP2P; }
    });
  }

  /** Cupo efectivo segun tipo seleccionado */
  cupoEfectivo(cuenta: AccountCop): number {
    const tipo = cuenta.cupoTipoP2P ?? 'AMBOS';
    const cajero = cuenta.cupoCajeroDisponibleHoy ?? 0;
    const corresponsal = cuenta.cupoCorresponsalDisponibleHoy ?? 0;
    if (tipo === 'CAJERO') return cajero;
    if (tipo === 'CORRESPONSAL') return corresponsal;
    return cajero + corresponsal;
  }

  cupoAgotado(cuenta: AccountCop): boolean {
    return this.cupoEfectivo(cuenta) <= 0;
  }

  bankIcon(bank: string): string {
    const icons: Record<string, string> = {
      NEQUI: 'assets/banks/nequi.png',
      BANCOLOMBIA: 'assets/banks/bancolombia.png',
      DAVIPLATA: 'assets/banks/daviplata.png',
    };
    return icons[bank] ?? '';
  }

  bankColor(bank: string): string {
    const colors: Record<string, string> = {
      NEQUI: '#7c3aed',
      BANCOLOMBIA: '#f59e0b',
      DAVIPLATA: '#ef4444',
    };
    return colors[bank] ?? '#6b7280';
  }

  onSseRefresh(): void {
    this.messageService.add({
      severity: 'info',
      summary: 'Nuevas ventas',
      detail: 'Se detectaron ventas P2P nuevas - tabla actualizada.',
      life: 4000
    });
    this.loadSyncStatus();
  }

  formatSyncTime(state: P2PSyncState): string {
    if (!state.lastSyncTime) return 'Nunca';
    const d = new Date(state.lastSyncTime);
    return new Intl.DateTimeFormat('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(d);
  }
}
