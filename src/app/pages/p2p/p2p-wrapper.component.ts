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
import { CheckboxModule } from 'primeng/checkbox';
import { MessageService, ConfirmationService } from 'primeng/api';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { VentasPendientesComponent } from './tabs/ventas-pendientes/ventas-pendientes.component';
import { VentasAsignadasComponent } from './tabs/ventas-asignadas/ventas-asignadas.component';
import { ComprasP2pComponent } from './tabs/compras-p2p/compras-p2p.component';
import { VentasEnCursoComponent } from './tabs/ventas-en-curso/ventas-en-curso.component';
import { ChatsHistorialComponent } from './chat/chats-historial.component';
import { P2PSyncService, ActiveP2POrder } from '../../core/services/p2p-sync.service';
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
    CheckboxModule,
    VentasPendientesComponent,
    VentasAsignadasComponent,
    ComprasP2pComponent,
    VentasEnCursoComponent,
    ChatsHistorialComponent,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './p2p-wrapper.component.html',
  styleUrls: ['./p2p-wrapper.component.css']
})
export class P2PWrapperComponent implements OnInit, OnDestroy {

  showCuentasModal = false;
  cuentasCop: AccountCop[] = [];
  /** Órdenes P2P en curso (abiertas) — para proyectar el saldo pre-asignado. */
  activeOrders: ActiveP2POrder[] = [];
  loadingCuentas = false;
  /** Cuentas cuya activación/desactivación está en camino. Varias a la vez: el operador puede
   *  seguir eligiendo cuentas sin esperar a que termine la anterior. */
  toggling = new Set<number>();

  // ── Revisión manual con el bot de conciliación (aparte de P2P a propósito:
  // no queremos que revisar cuentas dependa de cuáles están activas para
  // vender ahora mismo, ni arriesgarnos a tocar una cuenta en uso). ──
  showConciliacionModal = false;
  conciliacionSeleccionadas = new Set<number>();
  enviandoConciliacion = false;

  get cuentasActivasCount(): number {
    return this.cuentasCop.filter(c => c.activaParaP2P).length;
  }

  /** TODAS las cuentas Bancolombia del sistema, estén o no activas en P2P —
   *  a propósito independiente de cuentasFiltradas (que solo muestra las de P2P). */
  get cuentasBancolombia(): AccountCop[] {
    return this.cuentasCop
      .filter(c => c.bankType === 'BANCOLOMBIA')
      .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
  }

  abrirConciliacionModal(): void {
    this.conciliacionSeleccionadas.clear();
    this.showConciliacionModal = true;
  }

  seleccionConciliacionActiva(id: number | undefined): boolean {
    return id != null && this.conciliacionSeleccionadas.has(id);
  }

  toggleSeleccionConciliacion(id: number | undefined): void {
    if (id == null) return;
    if (this.conciliacionSeleccionadas.has(id)) this.conciliacionSeleccionadas.delete(id);
    else this.conciliacionSeleccionadas.add(id);
  }

  /** Texto + clase para el badge de última conciliación de una cuenta,
   *  o null si nunca se ha revisado (no se muestra nada en ese caso). */
  estadoConciliacion(c: AccountCop): { texto: string; clase: string } | null {
    if (!c.ultimaConciliacion) return null;

    const hace = this.tiempoRelativo(c.ultimaConciliacion);

    if (c.disponibleBanco === false) {
      const motivo = c.ultimoErrorConciliacion ? `: ${c.ultimoErrorConciliacion}` : '';
      return { texto: `${hace} · no disponible${motivo}`, clase: 'conciliacion-badge--error' };
    }
    if (c.disponibleBanco === true) {
      const desfase = c.ultimoDesfaseBanco;
      if (desfase != null && Math.abs(desfase) >= 1) {
        return { texto: `${hace} · desfase $${Math.round(desfase).toLocaleString('es-CO')}`, clase: 'conciliacion-badge--warn' };
      }
      return { texto: `${hace} · disponible`, clase: 'conciliacion-badge--ok' };
    }
    return { texto: hace, clase: '' };
  }

  private tiempoRelativo(iso: string): string {
    const ms = Date.now() - new Date(iso).getTime();
    const min = Math.floor(ms / 60000);
    if (min < 1) return 'hace instantes';
    if (min < 60) return `hace ${min} min`;
    const horas = Math.floor(min / 60);
    if (horas < 24) return `hace ${horas} h`;
    const dias = Math.floor(horas / 24);
    return `hace ${dias} d`;
  }

  /** Manda al bot, una por una, SOLO las cuentas que se marcaron a mano. */
  enviarSolicitudesConciliacion(): void {
    const ids = Array.from(this.conciliacionSeleccionadas);
    if (ids.length === 0 || this.enviandoConciliacion) return;

    this.enviandoConciliacion = true;
    let hechas = 0;
    let fallidas = 0;

    ids.forEach(id => {
      this.copService.solicitarConciliacionManual(id)
        .pipe(finalize(() => {
          hechas++;
          if (hechas === ids.length) {
            this.enviandoConciliacion = false;
            this.showConciliacionModal = false;
            this.messageService.add({
              severity: fallidas === 0 ? 'success' : 'warn',
              summary: 'Enviado al bot',
              detail: fallidas === 0
                ? `${ids.length} cuenta(s) en cola para el bot — debería reaccionar en el próximo ciclo (~1s).`
                : `${ids.length - fallidas} de ${ids.length} enviadas; ${fallidas} fallaron.`,
              life: 4000
            });
          }
        }))
        .subscribe({
          error: () => { fallidas++; }
        });
    });
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
    // El spinner (que esconde la lista) solo en la PRIMERA carga. Antes salía en cada refresco,
    // y como activar una cuenta dispara un refresco, la lista desaparecía unos segundos justo
    // cuando el operador iba a elegir la siguiente.
    this.loadingCuentas = this.cuentasCop.length === 0;
    this.copService.getAll()
      .pipe(finalize(() => this.loadingCuentas = false))
      .subscribe({
        next: c => {
          const nuevas = c ?? [];
          // Las que se están activando/desactivando en este momento conservan su estado en
          // pantalla: el refresco pudo salir antes de que el backend guardara el cambio.
          const actuales = new Map(this.cuentasCop.map(x => [x.id, x]));
          this.cuentasCop = nuevas.map(n =>
            n.id != null && this.toggling.has(n.id) && actuales.has(n.id)
              ? { ...n, activaParaP2P: actuales.get(n.id)!.activaParaP2P, cupoTipoP2P: actuales.get(n.id)!.cupoTipoP2P }
              : n);
        }
      });
  }


  toggleP2P(cuenta: AccountCop): void {
    const id = cuenta.id;
    if (id == null || this.toggling.has(id)) return;
    this.toggling.add(id);
    // La lista puede haberse refrescado mientras tanto (objetos nuevos): se actualiza la fila
    // vigente por id, no la referencia vieja.
    const fila = () => this.cuentasCop.find(c => c.id === id) ?? cuenta;
    const tipo = this.filtroTipo;
    this.copService.toggleActivaParaP2P(id)
      .subscribe({
        next: updated => {
          fila().activaParaP2P = updated.activaParaP2P;
          if (updated.activaParaP2P) {
            // Al activarla, queda con el medio de la pestaña actual (cajero o corresponsal).
            // Se refresca la lista UNA vez, cuando ya quedó guardado también el medio.
            fila().cupoTipoP2P = tipo;
            this.copService.setCupoTipo(id, tipo)
              .pipe(finalize(() => { this.toggling.delete(id); this.copService.notificarCambioP2P(); }))
              .subscribe({ next: u => fila().cupoTipoP2P = u.cupoTipoP2P });
          } else {
            this.toggling.delete(id);
            this.copService.notificarCambioP2P();
          }
          // Sin aviso de éxito: el check verde en la fila ya lo dice, y el toast tapaba la lista.
        },
        error: () => {
          this.toggling.delete(id);
          this.messageService.add({ severity: 'error', summary: 'Error', detail: `No se pudo actualizar ${cuenta.name}.` });
        }
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
  }
}
