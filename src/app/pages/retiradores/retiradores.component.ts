import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';
import { TableModule } from 'primeng/table';
import { TabViewModule } from 'primeng/tabview';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { Subscription, interval } from 'rxjs';
import { finalize, debounceTime } from 'rxjs/operators';

import {
  RetiradorService, Retirador, SolicitudRetiro, TipoRetiro,
  FuentePago, PagoRetiradorRequest, RankingRetirador, EstadoSolicitud, DetalleRetiro
} from '../../core/services/retirador.service';
import { AccountCopService, AccountCop } from '../../core/services/account-cop.service';
import { SaldosSseService } from '../../core/services/saldos-sse.service';
import { MovimientoService, MovimientoAjusteDto } from '../../core/services/movimiento.service';

interface CuentaSeleccionada {
  cuenta: AccountCop;
  seleccionada: boolean;
  tipoRetiro: TipoRetiro;
  montoCajero: number | null;
  montoCorresponsal: number | null;
}

/** Una fila calculada por el botón "Todo" — se envía como su PROPIA solicitud independiente. */
interface FilaAutomatica {
  cuenta: AccountCop;
  tipoRetiro: TipoRetiro;
  montoCajero: number | null;
  montoCorresponsal: number | null;
}

@Component({
  selector: 'app-retiradores',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ButtonModule, DialogModule, ConfirmDialogModule,
    DropdownModule, InputTextModule, InputNumberModule, TagModule, TooltipModule,
    ProgressSpinnerModule, ToastModule, TableModule, TabViewModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './retiradores.component.html',
  styleUrls: ['./retiradores.component.css']
})
export class RetiradoresComponent implements OnInit, OnDestroy {

  private saldosSub?: Subscription;
  private sinAsignarPollSub?: Subscription;

  retiradores: Retirador[] = [];
  cuentasCop: AccountCop[] = [];
  loading = false;

  // ── Modal nuevo/editar retirador ──
  showRetiradorDialog = false;
  editingRetirador: Retirador | null = null;
  retiradorForm: Retirador = { nombre: '' };
  cajaOptions: { label: string; value: any }[] = [];

  // ── Modal hacer retiro (con retirador asignado) ──
  showRetiroDialog = false;
  retiradorActivo: Retirador | null = null;
  cuentasParaRetiro: CuentaSeleccionada[] = [];
  savingRetiro = false;

  // ── Modal solicitud general ──
  showGeneralDialog = false;
  cuentasParaGeneral: CuentaSeleccionada[] = [];
  savingGeneral = false;

  // ── Solicitudes sin asignar ──
  solicitudesSinAsignar: SolicitudRetiro[] = [];
  loadingSinAsignar = false;
  showAsignarDialog = false;
  solicitudParaAsignar: SolicitudRetiro | null = null;
  retiradorAsignarId: number | null = null;

  // ── Modal historial ──
  showHistorialDialog = false;
  historialRetirador: Retirador | null = null;
  historial: SolicitudRetiro[] = [];
  loadingHistorial = false;

  // ── Modal movimientos de caja (todo lo que entra/sale de la caja del retirador:
  // retiros que confirma, pagos a proveedor, gastos, pagos que recibe, etc) ──
  showMovsCajaDialog = false;
  retiradorMovs: Retirador | null = null;
  movimientosCaja: any[] = [];
  loadingMovsCaja = false;
  ajustesCaja: MovimientoAjusteDto[] = [];
  loadingAjustesCaja = false;

  // ── Modal pago retirador ──
  showPagoDialog = false;
  pagoRetirador: Retirador | null = null;
  pagoFuente: FuentePago = 'COP';
  pagoCuentaCopId: number | null = null;
  pagoCajaId: number | null = null;
  pagoMonto: number | null = null;
  savingPago = false;
  cajaOptionsAll: { label: string; value: number }[] = [];

  // ── Ranking ──
  ranking: RankingRetirador[] = [];
  loadingRanking = false;

  fuenteOptions = [
    { label: 'Cuenta COP', value: 'COP' as FuentePago },
    { label: 'Caja / Efectivo', value: 'CAJA' as FuentePago },
  ];

  tipoOptions = [
    { label: 'Cajero ($ 2)', value: 'CAJERO' as TipoRetiro },
    { label: 'Corresponsal ($ 3)', value: 'CORRESPONSAL' as TipoRetiro },
    { label: 'Completo ($ 4)', value: 'COMPLETO' as TipoRetiro },
  ];

  constructor(
    private retiradorSvc: RetiradorService,
    private copSvc: AccountCopService,
    private msgSvc: MessageService,
    private confirmSvc: ConfirmationService,
    private saldosSse: SaldosSseService,
    private movimientoSvc: MovimientoService
  ) { }

  ngOnInit(): void {
    this.loadAll();
    this.copSvc.getP2PView().subscribe({ // sin cuentas bloqueadas
      next: c => {
        this.cuentasCop = c ?? [];
        this.loadMontosComprometidos();
      }
    });
    this.loadSinAsignar();
    this.loadRanking();

    // Tiempo real: cuando un vendedor mueve el saldo de una cuenta (venta P2P,
    // ajuste, etc), refresca los saldos acá al instante — así los montos que se
    // ven al armar una solicitud de retiro no quedan desactualizados.
    this.saldosSse.connect();
    this.saldosSub = this.saldosSse.cambioSaldos$
      .pipe(debounceTime(700))
      .subscribe(() => this.refrescarSaldos());

    // "Solicitudes sin retirador" se puede resolver desde Telegram (un
    // retirador le da Aceptar en el grupo) sin pasar por esta página, así que
    // no hay ningún evento que avise acá. Se refresca solo cada 5s para que
    // el banner desaparezca sin tener que recargar.
    this.sinAsignarPollSub = interval(5000).subscribe(() => this.loadSinAsignar(true));
  }

  ngOnDestroy(): void {
    this.saldosSub?.unsubscribe();
    this.saldosSse.disconnect();
    this.sinAsignarPollSub?.unsubscribe();
  }

  /** Refresco liviano de saldo Y cupo diario al recibir el evento SSE.
   *  Muta los mismos objetos AccountCop en vez de reemplazar el array, así que
   *  si hay un diálogo de "Solicitar retiro" abierto (que referencia esas mismas
   *  cuentas) también se actualiza en vivo, sin que el usuario tenga que recargar. */
  private refrescarSaldos(): void {
    this.copSvc.getSaldos().subscribe({
      next: saldos => {
        const map = new Map(saldos.map(s => [s.id, s]));
        this.cuentasCop.forEach(c => {
          if (c.id == null) return;
          const s = map.get(c.id);
          if (!s) return;
          c.balance = s.balance;
          c.cupoCajeroDisponibleHoy = s.cupoCajeroDisponibleHoy;
          c.cupoCorresponsalDisponibleHoy = s.cupoCorresponsalDisponibleHoy;
        });
      },
      error: () => { /* silencioso */ }
    });
    this.loadMontosComprometidos();
  }

  /** Carga cuánto de cada cuenta ya está comprometido en retiros enviados sin confirmar,
   *  para poder avisar al elegir cuentas en "Solicitar retiro" / "Solicitud general". */
  loadMontosComprometidos(): void {
    this.copSvc.getMontosComprometidos().subscribe({
      next: lista => {
        const porCuenta = new Map(lista.map(x => [x.cuentaCopId, x]));
        this.cuentasCop.forEach(c => {
          if (c.id == null) return;
          const info = porCuenta.get(c.id);
          c.montoComprometido = info?.montoComprometido ?? 0;
          c.montoCajeroComprometido = info?.montoCajeroComprometido ?? 0;
          c.montoCorresponsalComprometido = info?.montoCorresponsalComprometido ?? 0;
          c.solicitudesComprometidas = info?.solicitudes ?? [];
        });
      },
      error: () => { /* no bloquea la vista si falla */ }
    });
  }

  /** Saldo disponible real de una cuenta = saldo menos lo ya comprometido en retiros sin confirmar. */
  disponibleReal(cuenta: AccountCop): number {
    return (cuenta.balance ?? 0) - (cuenta.montoComprometido ?? 0);
  }

  /**
   * Cupo diario de CAJERO que en verdad queda disponible: el cupo del día
   * (que solo baja cuando un retiro se CONFIRMA) menos lo que ya está
   * comprometido hoy en solicitudes de cajero aún sin confirmar. Sin esto,
   * el sistema deja pedir más de lo que realmente cabe (el backend sí lo
   * valida y rechaza, pero el frontend debe mostrar/calcular lo mismo).
   */
  cupoCajeroDisponibleReal(cuenta: AccountCop): number {
    return Math.max((cuenta.cupoCajeroDisponibleHoy ?? 0) - (cuenta.montoCajeroComprometido ?? 0), 0);
  }

  /** Igual que cupoCajeroDisponibleReal(), pero para CORRESPONSAL. */
  cupoCorresponsalDisponibleReal(cuenta: AccountCop): number {
    return Math.max((cuenta.cupoCorresponsalDisponibleHoy ?? 0) - (cuenta.montoCorresponsalComprometido ?? 0), 0);
  }

  /** Monto que se le SOLICITÓ retirar en este detalle (cajero + corresponsal). */
  detalleMontoSolicitado(d: DetalleRetiro): number {
    return (d.montoCajero ?? 0) + (d.montoCorresponsal ?? 0);
  }

  /** true si el retirador registró una cifra REAL distinta a la solicitada ("Otra cifra" en Telegram). */
  detalleTieneMontoReal(d: DetalleRetiro): boolean {
    return d.montoCajeroReal != null || d.montoCorresponsalReal != null;
  }

  /** Monto que el retirador dijo que REALMENTE retiró (cae al solicitado si no registró uno distinto). */
  detalleMontoReal(d: DetalleRetiro): number {
    const cajero = d.montoCajeroReal ?? d.montoCajero ?? 0;
    const corresponsal = d.montoCorresponsalReal ?? d.montoCorresponsal ?? 0;
    return cajero + corresponsal;
  }

  /** Texto para el tooltip: qué solicitudes generan el monto comprometido de una cuenta. */
  tooltipComprometido(cuenta: AccountCop): string {
    if (!cuenta.solicitudesComprometidas?.length) return '';
    return cuenta.solicitudesComprometidas
      .map(s => {
        const quien = s.retiradorNombre ? s.retiradorNombre : 'sin asignar';
        const monto = (s.monto ?? 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
        return `#${s.solicitudId} — ${monto} (${quien})`;
      })
      .join('\n');
  }

  loadAll(): void {
    this.loading = true;
    this.retiradorSvc.getAll().pipe(finalize(() => this.loading = false)).subscribe({
      next: r => this.retiradores = r ?? [],
      error: () => this.retiradores = []
    });
  }

  /** @param silencioso true en los refrescos automáticos (poll), para no parpadear el spinner. */
  loadSinAsignar(silencioso = false): void {
    if (!silencioso) this.loadingSinAsignar = true;
    this.retiradorSvc.getSolicitudesSinAsignar()
      .pipe(finalize(() => this.loadingSinAsignar = false))
      .subscribe({ next: s => this.solicitudesSinAsignar = s ?? [] });
  }

  loadRanking(): void {
    this.loadingRanking = true;
    this.retiradorSvc.getRankingSemana()
      .pipe(finalize(() => this.loadingRanking = false))
      .subscribe({ next: r => this.ranking = r ?? [] });
  }

  // ── CRUD retirador ────────────────────────────────────────────

  openNew(): void {
    this.editingRetirador = null;
    this.retiradorForm = { nombre: '' };
    this.loadCajaOptions();
    this.showRetiradorDialog = true;
  }

  openEdit(r: Retirador): void {
    this.editingRetirador = r;
    this.retiradorForm = { nombre: r.nombre, efectivo: r.efectivo, telegramUsername: r.telegramUsername };
    this.loadCajaOptions();
    this.showRetiradorDialog = true;
  }

  loadCajaOptions(): void {
    this.copSvc.getAllCajas().subscribe({
      next: cajas => { this.cajaOptions = cajas.map(c => ({ label: c.name, value: c })); }
    });
  }

  saveRetirador(): void {
    if (!this.retiradorForm.nombre?.trim()) return;
    const obs = this.editingRetirador
      ? this.retiradorSvc.update(this.editingRetirador.id!, this.retiradorForm)
      : this.retiradorSvc.create(this.retiradorForm);

    obs.subscribe({
      next: () => { this.showRetiradorDialog = false; this.loadAll(); },
      error: () => this.msgSvc.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar.' })
    });
  }

  deleteRetirador(r: Retirador): void {
    this.confirmSvc.confirm({
      message: `¿Eliminar al retirador <strong>${r.nombre}</strong>? Esta acción no se puede deshacer.`,
      header: 'Eliminar retirador',
      icon: 'pi pi-trash',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.retiradorSvc.delete(r.id!).subscribe({
          next: () => {
            this.loadAll();
            this.msgSvc.add({ severity: 'success', summary: 'Eliminado', detail: `${r.nombre} fue eliminado.`, life: 3000 });
          },
          error: () => this.msgSvc.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar.' })
        });
      }
    });
  }

  // ── Modal retiro pre-asignado ─────────────────────────────────

  openRetiro(r: Retirador): void {
    this.retiradorActivo = r;
    this.cuentasParaRetiro = this.buildCuentasSeleccion();
    this.showRetiroDialog = true;
    this.loadMontosComprometidos(); // refresca por si hubo solicitudes nuevas desde el último load
  }

  /** Botón "Todo": autocompleta (marca y calcula montos) el retiro matutino, para que lo revises antes de enviar. */
  aplicarTodoRetiro(): void {
    this.cuentasParaRetiro = this.calcularSeleccionAutomatica();
  }

  // ── Modal solicitud general ───────────────────────────────────

  openGeneral(): void {
    this.cuentasParaGeneral = this.buildCuentasSeleccion();
    this.showGeneralDialog = true;
    this.loadMontosComprometidos();
  }

  /** Botón "Todo": autocompleta (marca y calcula montos) el retiro matutino, para que lo revises antes de enviar. */
  aplicarTodoGeneral(): void {
    this.cuentasParaGeneral = this.calcularSeleccionAutomatica();
  }

  get cuentasSeleccionadasGeneral(): CuentaSeleccionada[] {
    return this.cuentasParaGeneral.filter(c => c.seleccionada);
  }

  enviarSolicitudGeneral(): void {
    const sel = this.cuentasSeleccionadasGeneral;
    if (!sel.length) return;

    // Cada fila seleccionada se manda como su PROPIA solicitud (propio
    // mensaje/número en Telegram), nunca todas combinadas en una sola.
    const filas: FilaAutomatica[] = sel.map(c => ({
      cuenta: c.cuenta,
      tipoRetiro: c.tipoRetiro,
      montoCajero: this.requiresCajero(c.tipoRetiro) ? c.montoCajero : null,
      montoCorresponsal: this.requiresCorresponsal(c.tipoRetiro) ? c.montoCorresponsal : null,
    }));

    this.savingGeneral = true;
    this.enviarFilasSecuencial(filas, 'general', 0, 0, 0, (exitosas, total) => {
      this.savingGeneral = false;
      this.showGeneralDialog = false;
      this.loadSinAsignar();
      if (total === 1) {
        if (exitosas === 1) {
          this.msgSvc.add({ severity: 'success', summary: 'Solicitud enviada', detail: 'Se publicó en Telegram. El primero que la tome queda asignado.', life: 5000 });
        }
      } else {
        this.msgSvc.add({
          severity: exitosas === total ? 'success' : 'warn',
          summary: exitosas === total ? 'Solicitudes enviadas' : 'Terminado con errores',
          detail: `${exitosas} de ${total} publicadas en Telegram.`,
          life: 6000
        });
      }
    });
  }

  // ── Asignar retirador a solicitud general ─────────────────────

  openAsignar(s: SolicitudRetiro): void {
    this.solicitudParaAsignar = s;
    this.retiradorAsignarId = null;
    this.showAsignarDialog = true;
  }

  get retiradorOptions(): { label: string; value: number }[] {
    return this.retiradores.map(r => ({ label: r.nombre, value: r.id! }));
  }

  confirmarAsignacion(): void {
    if (!this.solicitudParaAsignar || !this.retiradorAsignarId) return;
    this.retiradorSvc.asignarRetirador(this.solicitudParaAsignar.id, { retiradorId: this.retiradorAsignarId })
      .subscribe({
        next: () => {
          this.showAsignarDialog = false;
          this.loadSinAsignar();
          this.loadAll();
          this.msgSvc.add({ severity: 'success', summary: 'Asignado', detail: 'El retirador fue asignado.', life: 3000 });
        },
        error: (err) => {
          const msg = err?.error?.message ?? 'No se pudo asignar.';
          this.msgSvc.add({ severity: 'error', summary: 'Error', detail: msg });
        }
      });
  }

  // ── Helpers cuentas ───────────────────────────────────────────

  private buildCuentasSeleccion(): CuentaSeleccionada[] {
    // De mayor a menor saldo, para elegir primero las cuentas con más plata.
    const ordenadas = [...this.cuentasCop].sort((a, b) => (b.balance ?? 0) - (a.balance ?? 0));
    return ordenadas.map(c => ({
      cuenta: c,
      seleccionada: false,
      tipoRetiro: 'CAJERO' as TipoRetiro,
      montoCajero: null,
      montoCorresponsal: null
    }));
  }

  /**
   * Trunca un valor a centenas (nunca redondea hacia arriba): el dinero no se
   * redondea, o hay o no hay. Ej: 2.847 → 2.800 (los 47 quedan en la cuenta).
   */
  private truncarACentenas(valor: number): number {
    return Math.floor(Math.max(valor, 0) / 100) * 100;
  }

  /**
   * Botón "Todo": calcula cuánto retirar de una cuenta para el retiro
   * matutino de rutina. Reglas (confirmadas con Milton):
   *  - Disponible real (saldo - comprometido) < $1.500 → no se toca esa cuenta.
   *  - $1.500 a $2.999 → CAJERO, tope $2.700 (y el cupo diario disponible).
   *  - $3.000 o más → CORRESPONSAL, tope $10.000 (y el cupo diario disponible).
   *    Si después de eso sobran $1.500 o más, ESE sobrante también se pide por
   *    CAJERO (tope $2.700).
   * Los montos siempre se truncan a centenas.
   */
  private calcularMontosAutomaticos(cuenta: AccountCop): { montoCajero: number; montoCorresponsal: number } {
    const disponible = this.truncarACentenas(this.disponibleReal(cuenta));
    // Cupo NETO: el cupo del día menos lo que ya está comprometido hoy en
    // solicitudes pendientes de ese mismo canal (cajero o corresponsal).
    const cupoCajero = this.truncarACentenas(this.cupoCajeroDisponibleReal(cuenta));
    const cupoCorresponsal = this.truncarACentenas(this.cupoCorresponsalDisponibleReal(cuenta));

    let montoCajero = 0;
    let montoCorresponsal = 0;

    if (disponible >= 3000) {
      montoCorresponsal = Math.min(disponible, 10000, cupoCorresponsal);
      const restante = disponible - montoCorresponsal;
      if (restante >= 1500) {
        montoCajero = Math.min(restante, 2700, cupoCajero);
      }
    } else if (disponible >= 1500) {
      montoCajero = Math.min(disponible, 2700, cupoCajero);
    }

    return { montoCajero, montoCorresponsal };
  }

  /**
   * Botón "Todo": arma la lista del diálogo con lo que tocaría retirar de cada
   * cuenta, para que Milton la REVISE (y edite si quiere) antes de enviar.
   * Nunca usa tipoRetiro COMPLETO: si a una cuenta le toca cajero Y
   * corresponsal, se generan DOS filas separadas para esa cuenta — cada una
   * queda como su propia solicitud al enviar (ver enviarFilasSecuencial), en
   * vez de un solo detalle "completo" o una solicitud combinada.
   */
  private calcularSeleccionAutomatica(): CuentaSeleccionada[] {
    const ordenadas = [...this.cuentasCop].sort((a, b) => (b.balance ?? 0) - (a.balance ?? 0));
    const resultado: CuentaSeleccionada[] = [];

    for (const cuenta of ordenadas) {
      const { montoCajero, montoCorresponsal } = this.calcularMontosAutomaticos(cuenta);

      if (montoCorresponsal > 0) {
        resultado.push({
          cuenta, seleccionada: true, tipoRetiro: 'CORRESPONSAL' as TipoRetiro,
          montoCajero: null, montoCorresponsal
        });
      }
      if (montoCajero > 0) {
        resultado.push({
          cuenta, seleccionada: true, tipoRetiro: 'CAJERO' as TipoRetiro,
          montoCajero, montoCorresponsal: null
        });
      }
      if (montoCajero <= 0 && montoCorresponsal <= 0) {
        // Nada que retirar hoy: la dejamos visible sin marcar, por si Milton
        // quiere revisarla o llenarla a mano.
        resultado.push({
          cuenta, seleccionada: false, tipoRetiro: 'CAJERO' as TipoRetiro,
          montoCajero: null, montoCorresponsal: null
        });
      }
    }

    return resultado;
  }

  /**
   * Envía las filas seleccionadas UNA POR UNA — cada una es su PROPIA
   * solicitud independiente (propio número, propio mensaje de Telegram,
   * propia confirmación), nunca una sola solicitud combinada con varios
   * detalles. Así queda la misma trazabilidad que si se mandaran a mano.
   */
  private enviarFilasSecuencial(
    filas: FilaAutomatica[], destino: 'retiro' | 'general',
    index: number, exitosas: number, sinTelegram: number,
    onFinish: (exitosas: number, total: number, sinTelegram: number) => void
  ): void {
    if (index >= filas.length) {
      onFinish(exitosas, filas.length, sinTelegram);
      return;
    }

    const fila = filas[index];
    const detalle = {
      cuentaCopId: fila.cuenta.id!,
      tipoRetiro: fila.tipoRetiro,
      montoCajero: fila.montoCajero,
      montoCorresponsal: fila.montoCorresponsal,
    };

    const obs = destino === 'retiro'
      ? this.retiradorSvc.crearSolicitud({ retiradorId: this.retiradorActivo!.id!, detalles: [detalle] })
      : this.retiradorSvc.crearSolicitudGeneral({ detalles: [detalle] });

    obs.subscribe({
      next: (res: any) => {
        const noTg = destino === 'retiro' && res?.telegramNotificado === false ? 1 : 0;
        this.enviarFilasSecuencial(filas, destino, index + 1, exitosas + 1, sinTelegram + noTg, onFinish);
      },
      error: (err) => {
        const msg = err?.error?.message ?? 'Error desconocido';
        this.msgSvc.add({ severity: 'error', summary: `No se pudo pedir ${fila.cuenta.name} (${fila.tipoRetiro})`, detail: msg, life: 6000 });
        // Seguimos con las demás filas — que una cuenta falle no debe frenar el resto.
        this.enviarFilasSecuencial(filas, destino, index + 1, exitosas, sinTelegram, onFinish);
      }
    });
  }

  get cuentasSeleccionadas(): CuentaSeleccionada[] {
    return this.cuentasParaRetiro.filter(c => c.seleccionada);
  }

  requiresCajero(tipo: TipoRetiro): boolean {
    return tipo === 'CAJERO' || tipo === 'COMPLETO';
  }

  requiresCorresponsal(tipo: TipoRetiro): boolean {
    return tipo === 'CORRESPONSAL' || tipo === 'COMPLETO';
  }

  get pagoEstimado(): number {
    return this.cuentasSeleccionadas.reduce((sum, c) => {
      const pago = c.tipoRetiro === 'CAJERO' ? 2 : c.tipoRetiro === 'CORRESPONSAL' ? 3 : 4;
      return sum + pago;
    }, 0);
  }

  get totalEstimado(): number {
    return this.cuentasSeleccionadas.reduce((sum, c) => {
      let t = 0;
      if (c.montoCajero) t += c.montoCajero;
      if (c.montoCorresponsal) t += c.montoCorresponsal;
      return sum + t;
    }, 0);
  }

  get pagoEstimadoGeneral(): number {
    return this.cuentasSeleccionadasGeneral.reduce((sum, c) => {
      const pago = c.tipoRetiro === 'CAJERO' ? 2 : c.tipoRetiro === 'CORRESPONSAL' ? 3 : 4;
      return sum + pago;
    }, 0);
  }

  get totalEstimadoGeneral(): number {
    return this.cuentasSeleccionadasGeneral.reduce((sum, c) => {
      let t = 0;
      if (c.montoCajero) t += c.montoCajero;
      if (c.montoCorresponsal) t += c.montoCorresponsal;
      return sum + t;
    }, 0);
  }

  enviarRetiro(): void {
    const sel = this.cuentasSeleccionadas;
    if (!sel.length || !this.retiradorActivo) return;

    // Cada fila seleccionada se manda como su PROPIA solicitud (propio
    // mensaje/número en Telegram), nunca todas combinadas en una sola.
    const filas: FilaAutomatica[] = sel.map(c => ({
      cuenta: c.cuenta,
      tipoRetiro: c.tipoRetiro,
      montoCajero: this.requiresCajero(c.tipoRetiro) ? c.montoCajero : null,
      montoCorresponsal: this.requiresCorresponsal(c.tipoRetiro) ? c.montoCorresponsal : null,
    }));

    this.savingRetiro = true;
    this.enviarFilasSecuencial(filas, 'retiro', 0, 0, 0, (exitosas, total, sinTelegram) => {
      this.savingRetiro = false;
      this.showRetiroDialog = false;
      this.loadAll();
      if (sinTelegram > 0) {
        this.msgSvc.add({
          severity: 'warn', summary: 'Faltó notificar por Telegram',
          detail: `${sinTelegram} solicitud(es) se crearon pero el retirador aún no ha vinculado su Telegram (debe enviarle /start al bot). Usa "Reenviar" en su historial.`,
          life: 8000
        });
      }
      if (total === 1) {
        if (exitosas === 1 && sinTelegram === 0) {
          this.msgSvc.add({ severity: 'success', summary: 'Solicitud enviada', detail: 'El retirador fue notificado.', life: 4000 });
        }
      } else {
        this.msgSvc.add({
          severity: exitosas === total ? 'success' : 'warn',
          summary: exitosas === total ? 'Solicitudes enviadas' : 'Terminado con errores',
          detail: `${exitosas} de ${total} enviadas correctamente.`,
          life: 6000
        });
      }
    });
  }

  // ── Historial ─────────────────────────────────────────────────

  openHistorial(r: Retirador): void {
    this.historialRetirador = r;
    this.historial = [];
    this.loadingHistorial = true;
    this.showHistorialDialog = true;
    this.retiradorSvc.historial(r.id!).pipe(finalize(() => this.loadingHistorial = false)).subscribe({
      next: h => this.historial = h ?? []
    });
  }

  // ── Movimientos de caja (todo lo que entra/sale del efectivo del retirador:
  // retiros que confirma, entregas a proveedor, gastos, pagos que recibe, etc).
  // Reusa el mismo endpoint /movimiento/caja/{id} que ya usa la pestaña Cajas,
  // así no se duplica ninguna lógica de backend. ────────────────────────────
  verMovimientosCaja(r: Retirador): void {
    if (!r.efectivo?.id) {
      this.msgSvc.add({ severity: 'warn', summary: 'Sin caja', detail: 'Este retirador no tiene caja asignada.' });
      return;
    }
    const cajaId = r.efectivo.id;
    this.retiradorMovs = r;
    this.movimientosCaja = [];
    this.ajustesCaja = [];
    this.loadingMovsCaja = true;
    this.loadingAjustesCaja = true;
    this.showMovsCajaDialog = true;

    this.movimientoSvc.getMovimientosPorCaja(cajaId).subscribe({
      next: data => {
        this.movimientosCaja = [...data].sort(
          (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
        );
      },
      error: () => { /* silencioso, la tabla queda vacía */ },
      complete: () => this.loadingMovsCaja = false
    });

    this.movimientoSvc.getAjustesCaja(cajaId).subscribe({
      next: ajustes => {
        this.ajustesCaja = [...ajustes].sort(
          (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
        );
      },
      error: () => { /* silencioso */ },
      complete: () => this.loadingAjustesCaja = false
    });
  }

  confirmarSolicitud(s: SolicitudRetiro): void {
    this.confirmSvc.confirm({
      message: `Confirmar retiro de <strong>${s.totalMonto | 0}</strong> COP.<br>Se descontará el dinero de las cuentas. Esta acción no se puede revertir.`,
      header: 'Confirmar retiro',
      icon: 'pi pi-check-circle',
      acceptLabel: 'Sí, confirmar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-success',
      accept: () => {
        this.retiradorSvc.confirmarSolicitud(s.id).subscribe({
          next: updated => {
            const idx = this.historial.findIndex(x => x.id === updated.id);
            if (idx > -1) this.historial[idx] = updated;
            this.loadAll();
            this.msgSvc.add({ severity: 'success', summary: 'Retiro confirmado', detail: 'El dinero fue descontado de las cuentas.', life: 3000 });
          },
          error: () => this.msgSvc.add({ severity: 'error', summary: 'Error', detail: 'No se pudo confirmar.' })
        });
      }
    });
  }

  /** Reintenta notificar por Telegram una solicitud PENDIENTE (ej: el retirador ya le dio /start al bot). */
  reenviarSolicitud(s: SolicitudRetiro): void {
    this.retiradorSvc.reenviarSolicitud(s.id).subscribe({
      next: (res) => {
        const idx = this.historial.findIndex(x => x.id === res.id);
        if (idx > -1) this.historial[idx] = res;
        if (res.telegramNotificado === false) {
          this.msgSvc.add({
            severity: 'warn', summary: 'Aún no se pudo notificar',
            detail: 'El retirador todavía no ha vinculado su Telegram (debe enviarle /start al bot).',
            life: 6000
          });
        } else {
          this.msgSvc.add({ severity: 'success', summary: 'Reenviado', detail: 'Se volvió a notificar al retirador por Telegram.', life: 4000 });
        }
      },
      error: (err) => {
        const msg = err?.error?.message ?? 'No se pudo reenviar la solicitud.';
        this.msgSvc.add({ severity: 'error', summary: 'Error', detail: msg });
      }
    });
  }

  /** Cancela una solicitud aún no completada (ej: se envió por error). No mueve saldos. */
  cancelarSolicitud(s: SolicitudRetiro): void {
    this.confirmSvc.confirm({
      message: `¿Cancelar la solicitud #${s.id} de <strong>${s.totalMonto | 0}</strong> COP?<br>Como el dinero solo se descuenta al confirmar, cancelarla ahora no afecta ningún saldo.`,
      header: 'Cancelar solicitud',
      icon: 'pi pi-times-circle',
      acceptLabel: 'Sí, cancelar',
      rejectLabel: 'Volver',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.retiradorSvc.cancelarSolicitud(s.id).subscribe({
          next: (res) => {
            const idxHist = this.historial.findIndex(x => x.id === res.id);
            if (idxHist > -1) this.historial[idxHist] = res;
            this.solicitudesSinAsignar = this.solicitudesSinAsignar.filter(x => x.id !== res.id);
            this.loadAll();
            this.msgSvc.add({ severity: 'success', summary: 'Solicitud cancelada', detail: 'No se movió ningún saldo.', life: 3000 });
          },
          error: (err) => {
            const msg = err?.error?.message ?? 'No se pudo cancelar la solicitud.';
            this.msgSvc.add({ severity: 'error', summary: 'Error', detail: msg });
          }
        });
      }
    });
  }

  // ── Pago retirador ────────────────────────────────────────────

  openPago(r: Retirador): void {
    this.pagoRetirador = r;
    this.pagoFuente = 'COP';
    this.pagoCuentaCopId = null;
    this.pagoCajaId = null;
    this.pagoMonto = r.saldoPendiente ?? 0;
    this.copSvc.getAllCajas().subscribe({
      next: cajas => this.cajaOptionsAll = cajas.map(c => ({ label: c.name, value: c.id! }))
    });
    this.showPagoDialog = true;
  }

  get copOptions(): { label: string; value: number }[] {
    return this.cuentasCop.map(c => ({
      label: `${c.name}  ·  Saldo: ${(c.balance ?? 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}`,
      value: c.id!
    }));
  }

  enviarPago(): void {
    if (!this.pagoRetirador || !this.pagoMonto || this.pagoMonto <= 0) return;
    if (this.pagoFuente === 'COP' && !this.pagoCuentaCopId) {
      this.msgSvc.add({ severity: 'warn', summary: 'Selecciona una cuenta COP', detail: '' });
      return;
    }
    if (this.pagoFuente === 'CAJA' && !this.pagoCajaId) {
      this.msgSvc.add({ severity: 'warn', summary: 'Selecciona una caja', detail: '' });
      return;
    }

    const req: PagoRetiradorRequest = {
      fuente: this.pagoFuente,
      cuentaCopId: this.pagoFuente === 'COP' ? this.pagoCuentaCopId : null,
      cajaId: this.pagoFuente === 'CAJA' ? this.pagoCajaId : null,
      monto: this.pagoMonto
    };

    this.savingPago = true;
    this.retiradorSvc.pagar(this.pagoRetirador.id!, req)
      .pipe(finalize(() => this.savingPago = false))
      .subscribe({
        next: updated => {
          const idx = this.retiradores.findIndex(r => r.id === updated.id);
          if (idx > -1) this.retiradores[idx] = updated;
          this.showPagoDialog = false;
          this.msgSvc.add({ severity: 'success', summary: 'Pago registrado', detail: `Se pagaron $${this.pagoMonto!.toLocaleString('es-CO')} a ${updated.nombre}.`, life: 4000 });
        },
        error: (err) => {
          const msg = err?.error?.message ?? 'No se pudo registrar el pago.';
          this.msgSvc.add({ severity: 'error', summary: 'Error', detail: msg });
        }
      });
  }

  // ── Ranking ───────────────────────────────────────────────────

  medalIcon(pos: number): string {
    return pos === 1 ? '🥇' : pos === 2 ? '🥈' : pos === 3 ? '🥉' : `${pos}.`;
  }

  estadoSeverity(estado: EstadoSolicitud): 'warning' | 'info' | 'success' | 'danger' {
    if (estado === 'COMPLETADO') return 'success';
    if (estado === 'PENDIENTE') return 'warning';
    if (estado === 'CANCELADO') return 'danger';
    return 'info';
  }

  bankIcon(bankType: string): string {
    const map: Record<string, string> = {
      BANCOLOMBIA: 'assets/layout/images/bancolombia.png',
      NEQUI: 'assets/layout/images/nequi.png',
      DAVIPLATA: 'assets/layout/images/daviplata.png',
    };
    return map[bankType] ?? '';
  }
}
