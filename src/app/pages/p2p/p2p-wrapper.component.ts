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
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { VentasPendientesComponent } from './tabs/ventas-pendientes/ventas-pendientes.component';
import { VentasAsignadasComponent } from './tabs/ventas-asignadas/ventas-asignadas.component';
import { ComprasP2pComponent } from './tabs/compras-p2p/compras-p2p.component';
import { VentasEnCursoComponent } from './tabs/ventas-en-curso/ventas-en-curso.component';
import { P2PSyncService, P2PSyncState, ActiveP2POrder } from '../../core/services/p2p-sync.service';
import { AccountCopService, AccountCop } from '../../core/services/account-cop.service';
import { RetiradorService } from '../../core/services/retirador.service';

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
    ConfirmDialogModule,
    VentasPendientesComponent,
    VentasAsignadasComponent,
    ComprasP2pComponent,
    VentasEnCursoComponent,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './p2p-wrapper.component.html',
  styleUrls: ['./p2p-wrapper.component.css']
})
export class P2PWrapperComponent implements OnInit, OnDestroy {
  syncStates: P2PSyncState[] = [];
  syncing = false;

  showCuentasModal = false;
  cuentasCop: AccountCop[] = [];
  /** Órdenes P2P en curso (abiertas) — para proyectar el saldo pre-asignado. */
  activeOrders: ActiveP2POrder[] = [];
  loadingCuentas = false;
  togglingId: number | null = null;

  get cuentasActivasCount(): number {
    return this.cuentasCop.filter(c => c.activaParaP2P).length;
  }

  // ── Filtro por tipo de cupo de retiro (modal Cuentas COP en P2P) ──
  filtroTipo: 'CAJERO' | 'CORRESPONSAL' = 'CAJERO';
  filtroOpciones: { label: string; value: 'CAJERO' | 'CORRESPONSAL' }[] = [
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
      .filter(c => this.filtroTipo === 'CAJERO'
        ? (c.cupoCajeroDisponibleHoy ?? 0) > 0
        : (c.cupoCorresponsalDisponibleHoy ?? 0) > 0)
      .filter(c => this.bancosSeleccionados.size === 0 || this.bancosSeleccionados.has(c.bankType))
      .sort((a, b) => (b.balance ?? 0) - (a.balance ?? 0));
  }

  constructor(
    private syncService: P2PSyncService,
    private messageService: MessageService,
    private copService: AccountCopService,
    private retiradorService: RetiradorService,
    private confirmationService: ConfirmationService
  ) {}

  private p2pSub?: Subscription;

  ngOnInit(): void {
    this.loadSyncStatus();
    this.loadCuentas();
    this.loadActiveOrders();
    // Si otra vista cambia el estado P2P de una cuenta, recargamos para sincronizar
    this.p2pSub = this.copService.p2pCambio$.subscribe(() => this.loadCuentas());
  }

  /** Abre la modal y refresca cuentas + órdenes en curso para el saldo proyectado. */
  openCuentasModal(): void {
    this.showCuentasModal = true;
    this.loadCuentas();
    this.loadActiveOrders();
  }

  loadActiveOrders(): void {
    this.syncService.getActiveOrders().subscribe({
      next: o => this.activeOrders = o ?? [],
      error: () => this.activeOrders = []
    });
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
          // Al activarla, queda con el medio de la pestaña actual (cajero o corresponsal).
          if (updated.activaParaP2P && cuenta.id) {
            cuenta.cupoTipoP2P = this.filtroTipo;
            this.copService.setCupoTipo(cuenta.id, this.filtroTipo).subscribe({
              next: u => { cuenta.cupoTipoP2P = u.cupoTipoP2P; this.copService.notificarCambioP2P(); }
            });
          }
          this.copService.notificarCambioP2P();
          this.messageService.add({
            severity: 'success',
            summary: updated.activaParaP2P ? 'Cuenta activada' : 'Cuenta desactivada',
            detail: `${cuenta.name} ${updated.activaParaP2P ? 'incluida en' : 'excluida de'} P2P (${updated.activaParaP2P ? (this.filtroTipo === 'CAJERO' ? 'cajero' : 'corresponsal') : ''})`,
            life: 2500
          });
        },
        error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar.' })
      });
  }

  /** Cupo efectivo segun el FILTRO de tipo activo (Cajero / Corresponsal / Todos). */
  cupoEfectivo(cuenta: AccountCop): number {
    return this.filtroTipo === 'CAJERO'
      ? (cuenta.cupoCajeroDisponibleHoy ?? 0)
      : (cuenta.cupoCorresponsalDisponibleHoy ?? 0);
  }

  cupoAgotado(cuenta: AccountCop): boolean {
    return this.cupoEfectivo(cuenta) <= 0;
  }

  // ── Saldo proyectado por ventas P2P en curso pre-asignadas ────────

  /** Suma de pesos COP de las órdenes en curso pre-asignadas a esta cuenta. */
  pesosEnCurso(cuenta: AccountCop): number {
    if (!cuenta.id) return 0;
    return this.activeOrders
      .filter(o => o.preAsignadoCopId === cuenta.id)
      .reduce((sum, o) => sum + (o.pesosCop ?? 0), 0);
  }

  /** ¿La cuenta tiene ventas en curso pre-asignadas? (para pintar el saldo en amarillo). */
  tieneEnCurso(cuenta: AccountCop): boolean {
    return this.pesosEnCurso(cuenta) > 0;
  }

  /** Saldo actual + pesos de las ventas en curso que se le pre-asignaron. */
  saldoProyectado(cuenta: AccountCop): number {
    return (cuenta.balance ?? 0) + this.pesosEnCurso(cuenta);
  }

  // ── Retiro (botón "Retirar" de la modal Cuentas COP en P2P) ───

  solicitandoId: number | null = null;

  /** Cupo máximo del día para el medio del FILTRO activo, según el banco de la cuenta. */
  cupoDelMedio(cuenta: AccountCop): number {
    const max = this.cupoMax[cuenta.bankType];
    if (!max) return 0;
    return this.filtroTipo === 'CAJERO' ? max.cajero : max.corresponsal;
  }

  /** Solo se habilita el retiro si el saldo cubre el cupo del medio. */
  puedeSolicitarRetiro(cuenta: AccountCop): boolean {
    return (cuenta.balance ?? 0) >= this.cupoDelMedio(cuenta);
  }

  /** Crea la solicitud de retiro de esa cuenta al instante (tras confirmar) y la quita de la lista. */
  solicitarRetiro(cuenta: AccountCop): void {
    if (!cuenta.id || !this.puedeSolicitarRetiro(cuenta)) return;
    const monto = this.cupoDelMedio(cuenta);
    const medioLabel = this.filtroTipo === 'CAJERO' ? 'cajero' : 'corresponsal';
    this.confirmationService.confirm({
      header: '¿Estás seguro?',
      message: `¿Deseas solicitar el retiro de ${cuenta.name} por ${medioLabel} ($${monto.toLocaleString('es-CO')})?`,
      acceptLabel: 'Sí, solicitar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.solicitandoId = cuenta.id!;
        this.retiradorService.crearSolicitudGeneral({
          detalles: [{
            cuentaCopId: cuenta.id!,
            tipoRetiro: this.filtroTipo,
            montoCajero: this.filtroTipo === 'CAJERO' ? monto : null,
            montoCorresponsal: this.filtroTipo === 'CORRESPONSAL' ? monto : null,
          }]
        })
        .pipe(finalize(() => this.solicitandoId = null))
        .subscribe({
          next: () => {
            // Al solicitar el retiro, la cuenta se deselecciona de P2P automáticamente.
            cuenta.activaParaP2P = false;
            this.copService.toggleActivaParaP2P(cuenta.id!).subscribe({
              next: u => { cuenta.activaParaP2P = u.activaParaP2P; this.copService.notificarCambioP2P(); },
              error: () => this.copService.notificarCambioP2P()
            });
            this.messageService.add({
              severity: 'success', summary: 'Retiro solicitado',
              detail: `${cuenta.name} — solicitud creada y cuenta deseleccionada de P2P.`, life: 3000
            });
          },
          error: () => this.messageService.add({
            severity: 'error', summary: 'Error', detail: 'No se pudo crear la solicitud de retiro.'
          })
        });
      }
    });
  }

  // ── Aviso de cupo lleno (saldo proyectado alcanzó el cupo del medio) ──

  showCupoLlenoModal = false;
  cupoLlenoCuenta: AccountCop | null = null;

  /** El saldo proyectado (saldo + ventas en curso pre-asignadas) ya alcanzó el cupo del medio. */
  cupoLleno(cuenta: AccountCop): boolean {
    const cupo = this.cupoDelMedio(cuenta);
    return cupo > 0 && this.saldoProyectado(cuenta) >= cupo;
  }

  abrirAvisoCupoLleno(cuenta: AccountCop): void {
    this.cupoLlenoCuenta = cuenta;
    this.showCupoLlenoModal = true;
  }

  /** Mantener la cuenta activa para seguir usándola en ese cupo. */
  cupoLlenoSeguir(): void {
    this.showCupoLlenoModal = false;
  }

  /** Quitar la cuenta de P2P (deseleccionar). */
  cupoLlenoDeseleccionar(): void {
    if (this.cupoLlenoCuenta) this.toggleP2P(this.cupoLlenoCuenta);
    this.showCupoLlenoModal = false;
  }

  /** Cambiar por otra: libera esta cuenta y deja la lista para elegir otra. */
  cupoLlenoCambiar(): void {
    if (this.cupoLlenoCuenta) this.toggleP2P(this.cupoLlenoCuenta);
    this.showCupoLlenoModal = false;
    this.messageService.add({
      severity: 'info', summary: 'Cuenta liberada',
      detail: 'Selecciona otra cuenta COP para ese cupo.', life: 3500
    });
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
