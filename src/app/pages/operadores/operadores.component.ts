import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TabViewModule } from 'primeng/tabview';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { OperadorService, OperadorCard, PagoOperador } from '../../core/services/operador.service';
import { NotificationService } from '../../core/services/notification.service';
import { RetiradoresComponent } from '../retiradores/retiradores.component';
import { AccountCop, AccountCopService } from '../../core/services/account-cop.service';

@Component({
  selector: 'app-operadores',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ButtonModule, CalendarModule, TagModule,
    ProgressSpinnerModule, TabViewModule, DialogModule, DropdownModule,
    InputTextModule, InputNumberModule, ConfirmDialogModule,
    RetiradoresComponent
  ],
  providers: [ConfirmationService],
  templateUrl: './operadores.component.html',
  styleUrls: ['./operadores.component.css']
})
export class OperadoresComponent implements OnInit, OnDestroy {

  fecha: Date = new Date();
  cards: OperadorCard[] = [];
  loading = false;

  /** Tick de 1s que hace correr el cronómetro de las jornadas activas en vivo. */
  private tickTimer: ReturnType<typeof setInterval> | null = null;

  // Tarifa
  tarifa = 7500;
  editandoTarifa = false;
  tarifaTemp = 7500;
  guardandoTarifa = false;

  // Crear operador
  showCrear = false;
  nuevoUsername = '';
  nuevoPassword = '';
  nuevoRol: 'ADMIN' | 'OPERARIO' = 'OPERARIO';
  creando = false;

  // Restablecer clave
  showReset = false;
  resetId: number | null = null;
  resetUsername = '';
  resetPassword = '';
  reseteando = false;

  rolOptions = [
    { label: 'Operario', value: 'OPERARIO' },
    { label: 'Admin', value: 'ADMIN' }
  ];

  // -- Pago al operador --
  cuentasCop: AccountCop[] = [];
  cajas: { id: number; name: string; saldo: number }[] = [];
  showPagar = false;
  pagarCard: OperadorCard | null = null;
  pagarTipo: 'cuenta' | 'caja' = 'cuenta';
  cuentaPagoId: number | null = null;
  cajaPagoId: number | null = null;
  pagando = false;

  // -- Historial de pagos por operador (en modal) --
  showHistorial = false;
  historialCard: OperadorCard | null = null;
  historialPagos: PagoOperador[] = [];
  cargandoHistorial = false;

  constructor(
    private operadorService: OperadorService,
    private notification: NotificationService,
    private confirm: ConfirmationService,
    private accountService: AccountCopService
  ) {}

  ngOnInit(): void {
    this.cargar();
    // Cuentas COP y cajas para el selector de origen del pago.
    this.accountService.getP2PView().subscribe({ next: d => this.cuentasCop = d, error: () => {} });
    this.accountService.getAllCajas().subscribe({ next: d => this.cajas = d, error: () => {} });
    // Cada segundo suma tiempo a las jornadas activas y recalcula el pago, para que el
    // cronómetro no se vea congelado en "0 s" mientras el operador está trabajando.
    this.tickTimer = setInterval(() => this.tickJornadasActivas(), 1000);
  }

  ngOnDestroy(): void {
    if (this.tickTimer) { clearInterval(this.tickTimer); this.tickTimer = null; }
  }

  /** Solo tiene efecto visual cuando la fecha seleccionada es HOY (no tiene sentido correr el
   *  cronómetro sobre un día pasado). Suma 1s y recalcula el pago de cada jornada activa. */
  private tickJornadasActivas(): void {
    if (!this.esHoy()) return;
    for (const c of this.cards) {
      if (c.jornadaActiva) {
        c.tiempoTrabajadoSegundos = (c.tiempoTrabajadoSegundos ?? 0) + 1;
        c.pagoCop = Math.round((c.tiempoTrabajadoSegundos / 3600) * this.tarifa);
      }
    }
  }

  /** ¿La fecha seleccionada en el filtro es el día de hoy? */
  private esHoy(): boolean {
    const hoy = new Date();
    const d = this.fecha ?? hoy;
    return d.getFullYear() === hoy.getFullYear()
      && d.getMonth() === hoy.getMonth()
      && d.getDate() === hoy.getDate();
  }

  private fechaStr(): string {
    const d = this.fecha ?? new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  }

  cargar(): void {
    this.loading = true;
    forkJoin({
      resumen: this.operadorService.getResumen(this.fechaStr()),
      tarifa: this.operadorService.getTarifa()
    })
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: ({ resumen, tarifa }) => {
          this.cards = resumen ?? [];
          this.tarifa = tarifa?.valorHora ?? 7500;
        },
        error: () => this.notification.error('No se pudo cargar el panel de operadores.')
      });
  }

  onFechaChange(): void {
    this.cargar();
  }

  // -- Formatos --
  formatTiempo(seg: number): string {
    const s = Math.max(0, Math.floor(seg ?? 0));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    if (h > 0) return `${h} h ${m} m`;
    if (m > 0) return `${m} m`;
    return `${s} s`;
  }

  formatCop(n: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency', currency: 'COP', maximumFractionDigits: 0
    }).format(n ?? 0);
  }

  rolSeverity(rol: string | null): 'danger' | 'info' | 'secondary' {
    if (rol === 'ADMIN') return 'danger';
    if (rol === 'OPERARIO') return 'info';
    return 'secondary';
  }

  get totalPago(): number {
    return this.cards.reduce((s, c) => s + (c.pagoCop ?? 0), 0);
  }

  // -- Copiar credenciales --
  copiarCredenciales(c: OperadorCard): void {
    if (!c.passwordPlano) {
      this.notification.warn('Este usuario no tiene la clave guardada. Restablécela para poder copiarla.');
      return;
    }
    const texto = `Usuario: ${c.username}\nContraseña: ${c.passwordPlano}`;
    navigator.clipboard.writeText(texto).then(
      () => this.notification.success(`Credenciales de ${c.username} copiadas.`),
      () => this.notification.error('No se pudieron copiar las credenciales.')
    );
  }

  // -- Crear operador --
  abrirCrear(): void {
    this.nuevoUsername = '';
    this.nuevoPassword = '';
    this.nuevoRol = 'OPERARIO';
    this.showCrear = true;
  }

  guardarCrear(): void {
    if (this.creando) return;
    const user = this.nuevoUsername.trim();
    if (!user || !this.nuevoPassword) {
      this.notification.warn('Usuario y contraseña son obligatorios.');
      return;
    }
    this.creando = true;
    this.operadorService.crear({ username: user, password: this.nuevoPassword, rol: this.nuevoRol })
      .pipe(finalize(() => this.creando = false))
      .subscribe({
        next: () => {
          this.notification.success('Operador creado correctamente.');
          this.showCrear = false;
          this.cargar();
        },
        error: err => this.notification.error(err?.error?.error ?? 'No se pudo crear el operador.')
      });
  }

  // -- Restablecer clave --
  abrirReset(c: OperadorCard): void {
    this.resetId = c.id;
    this.resetUsername = c.username;
    this.resetPassword = '';
    this.showReset = true;
  }

  guardarReset(): void {
    if (this.reseteando || this.resetId == null) return;
    if (!this.resetPassword) {
      this.notification.warn('Escribe la nueva contraseña.');
      return;
    }
    this.reseteando = true;
    this.operadorService.cambiarPassword(this.resetId, this.resetPassword)
      .pipe(finalize(() => this.reseteando = false))
      .subscribe({
        next: () => {
          this.notification.success(`Contraseña de ${this.resetUsername} actualizada.`);
          this.showReset = false;
          this.cargar();
        },
        error: () => this.notification.error('No se pudo actualizar la contrasena.')
      });
  }

  // -- Eliminar --
  confirmarEliminar(c: OperadorCard): void {
    this.confirm.confirm({
      header: 'Eliminar operador',
      message: `¿Seguro que quieres eliminar a "${c.username}"? Esta acción no se puede deshacer.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      rejectButtonStyleClass: 'p-button-text p-button-sm',
      accept: () => {
        this.operadorService.eliminar(c.id).subscribe({
          next: () => {
            this.notification.success('Operador eliminado.');
            this.cargar();
          },
          error: () => this.notification.error('No se pudo eliminar el operador.')
        });
      }
    });
  }

  // -- Jornada de un operador (el admin arranca/detiene su cronómetro) --
  /** Id del operador cuya jornada se está iniciando/terminando (para el spinner del botón). */
  jornadaCargandoId: number | null = null;

  toggleJornadaOperador(c: OperadorCard): void {
    if (this.jornadaCargandoId === c.id) return;
    this.jornadaCargandoId = c.id;

    const iniciando = !c.jornadaActiva; // acción según el estado ACTUAL, antes de cambiarlo
    const accion$ = iniciando
      ? this.operadorService.iniciarJornadaDe(c.id)
      : this.operadorService.finalizarJornadaDe(c.id);

    accion$.pipe(finalize(() => this.jornadaCargandoId = null)).subscribe({
      next: () => {
        // Cambio OPTIMISTA y AUTORITATIVO en la UI: el botón y el cronómetro cambian al
        // instante y NO se recargan del backend (para que un resumen desfasado no los revierta).
        // Los números se recalculan en vivo con el ticker; el botón "Actualizar" sincroniza.
        c.jornadaActiva = iniciando;
        if (iniciando && !c.tiempoTrabajadoSegundos) c.tiempoTrabajadoSegundos = 0;
        this.notification.success(
          iniciando
            ? `Se inició la jornada de ${c.username}.`
            : `Jornada de ${c.username} finalizada.`
        );
      },
      error: () => this.notification.error('No se pudo cambiar la jornada del operador.')
    });
  }

  // -- Pago al operador -------------------------------------------------

  /** ¿Se puede pagar? Jornada detenida, con tiempo trabajado y aún sin pagar ese día. */
  puedePagar(c: OperadorCard): boolean {
    return !c.jornadaActiva && (c.tiempoTrabajadoSegundos ?? 0) > 0 && !c.pagadoHoy;
  }

  abrirPagar(c: OperadorCard): void {
    this.pagarCard = c;
    this.pagarTipo = 'cuenta';
    this.cuentaPagoId = null;
    this.cajaPagoId = null;
    this.showPagar = true;
  }

  confirmarPago(): void {
    if (this.pagando || !this.pagarCard) return;

    const req: { fecha?: string; cuentaCopId?: number; cajaId?: number } = { fecha: this.fechaStr() };
    if (this.pagarTipo === 'cuenta') {
      if (!this.cuentaPagoId) { this.notification.warn('Elige la cuenta COP de donde sale el pago.'); return; }
      req.cuentaCopId = this.cuentaPagoId;
    } else {
      if (!this.cajaPagoId) { this.notification.warn('Elige la caja de donde sale el pago.'); return; }
      req.cajaId = this.cajaPagoId;
    }

    this.pagando = true;
    this.operadorService.pagarOperador(this.pagarCard.id, req)
      .pipe(finalize(() => this.pagando = false))
      .subscribe({
        next: (pago) => {
          this.notification.success(`Pago de ${this.formatCop(pago.monto)} a ${this.pagarCard!.username} registrado.`);
          this.showPagar = false;
          // Marca la card como pagada al instante y recarga números.
          this.pagarCard!.pagadoHoy = true;
          // Si el historial de ese operador está abierto en el modal, lo refrescamos.
          if (this.showHistorial && this.historialCard?.id === this.pagarCard!.id) this.cargarHistorial(this.pagarCard!);
          this.cargar();
        },
        error: (err) => {
          const msg = err?.error?.message || 'No se pudo registrar el pago.';
          this.notification.error(msg);
        }
      });
  }

  // -- Historial de pagos (modal) --------------------------------------

  abrirHistorial(c: OperadorCard): void {
    this.historialCard = c;
    this.historialPagos = [];
    this.showHistorial = true;
    this.cargarHistorial(c);
  }

  private cargarHistorial(c: OperadorCard): void {
    this.cargandoHistorial = true;
    this.operadorService.historialPagos(c.id)
      .pipe(finalize(() => this.cargandoHistorial = false))
      .subscribe({
        next: pagos => this.historialPagos = pagos ?? [],
        error: () => { this.historialPagos = []; this.notification.error('No se pudo cargar el historial de pagos.'); }
      });
  }

  /** Total pagado histórico al operador del modal abierto. */
  get totalHistorial(): number {
    return this.historialPagos.reduce((s, p) => s + (p.monto ?? 0), 0);
  }

  formatFecha(iso: string): string {
    if (!iso) return '';
    const d = new Date(iso);
    return new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(d);
  }

  // -- Tarifa --
  editarTarifa(): void {
    this.tarifaTemp = this.tarifa;
    this.editandoTarifa = true;
  }

  cancelarTarifa(): void {
    this.editandoTarifa = false;
  }

  guardarTarifa(): void {
    if (this.guardandoTarifa) return;
    const valor = Number(this.tarifaTemp);
    if (!Number.isFinite(valor) || valor < 0) {
      this.notification.warn('La tarifa debe ser un número válido.');
      return;
    }
    this.guardandoTarifa = true;
    this.operadorService.setTarifa(valor)
      .pipe(finalize(() => this.guardandoTarifa = false))
      .subscribe({
        next: () => {
          this.tarifa = valor;
          this.editandoTarifa = false;
          this.notification.success('Tarifa por hora actualizada.');
          this.cargar();
        },
        error: () => this.notification.error('No se pudo actualizar la tarifa.')
      });
  }
}
