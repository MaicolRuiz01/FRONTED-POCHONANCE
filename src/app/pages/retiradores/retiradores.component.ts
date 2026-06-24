import { Component, OnInit } from '@angular/core';
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
import { MessageService, ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { finalize } from 'rxjs/operators';

import {
  RetiradorService, Retirador, SolicitudRetiro, TipoRetiro,
  FuentePago, PagoRetiradorRequest, RankingRetirador, EstadoSolicitud
} from '../../core/services/retirador.service';
import { AccountCopService, AccountCop } from '../../core/services/account-cop.service';

interface CuentaSeleccionada {
  cuenta: AccountCop;
  seleccionada: boolean;
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
    ProgressSpinnerModule, ToastModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './retiradores.component.html',
  styleUrls: ['./retiradores.component.css']
})
export class RetiradoresComponent implements OnInit {

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
    { label: 'Cajero ($ 2.000)', value: 'CAJERO' as TipoRetiro },
    { label: 'Corresponsal ($ 3.000)', value: 'CORRESPONSAL' as TipoRetiro },
    { label: 'Completo ($ 4.000)', value: 'COMPLETO' as TipoRetiro },
  ];

  constructor(
    private retiradorSvc: RetiradorService,
    private copSvc: AccountCopService,
    private msgSvc: MessageService,
    private confirmSvc: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.loadAll();
    this.copSvc.getAll().subscribe({ next: c => this.cuentasCop = c ?? [] });
    this.loadSinAsignar();
    this.loadRanking();
  }

  loadAll(): void {
    this.loading = true;
    this.retiradorSvc.getAll().pipe(finalize(() => this.loading = false)).subscribe({
      next: r => this.retiradores = r ?? [],
      error: () => this.retiradores = []
    });
  }

  loadSinAsignar(): void {
    this.loadingSinAsignar = true;
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
  }

  // ── Modal solicitud general ───────────────────────────────────

  openGeneral(): void {
    this.cuentasParaGeneral = this.buildCuentasSeleccion();
    this.showGeneralDialog = true;
  }

  get cuentasSeleccionadasGeneral(): CuentaSeleccionada[] {
    return this.cuentasParaGeneral.filter(c => c.seleccionada);
  }

  enviarSolicitudGeneral(): void {
    const sel = this.cuentasSeleccionadasGeneral;
    if (!sel.length) return;

    this.savingGeneral = true;
    this.retiradorSvc.crearSolicitudGeneral({
      detalles: sel.map(c => ({
        cuentaCopId: c.cuenta.id!,
        tipoRetiro: c.tipoRetiro,
        montoCajero: this.requiresCajero(c.tipoRetiro) ? c.montoCajero : null,
        montoCorresponsal: this.requiresCorresponsal(c.tipoRetiro) ? c.montoCorresponsal : null,
      }))
    }).pipe(finalize(() => this.savingGeneral = false)).subscribe({
      next: () => {
        this.showGeneralDialog = false;
        this.loadSinAsignar();
        this.msgSvc.add({ severity: 'success', summary: 'Solicitud enviada', detail: 'Se publicó en Telegram. El primero que la tome queda asignado.', life: 5000 });
      },
      error: () => this.msgSvc.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear la solicitud.' })
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
    return this.cuentasCop.map(c => ({
      cuenta: c,
      seleccionada: false,
      tipoRetiro: 'CAJERO' as TipoRetiro,
      montoCajero: null,
      montoCorresponsal: null
    }));
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
      const pago = c.tipoRetiro === 'CAJERO' ? 2000 : c.tipoRetiro === 'CORRESPONSAL' ? 3000 : 4000;
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
      const pago = c.tipoRetiro === 'CAJERO' ? 2000 : c.tipoRetiro === 'CORRESPONSAL' ? 3000 : 4000;
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

    this.savingRetiro = true;
    this.retiradorSvc.crearSolicitud({
      retiradorId: this.retiradorActivo.id!,
      detalles: sel.map(c => ({
        cuentaCopId: c.cuenta.id!,
        tipoRetiro: c.tipoRetiro,
        montoCajero: this.requiresCajero(c.tipoRetiro) ? c.montoCajero : null,
        montoCorresponsal: this.requiresCorresponsal(c.tipoRetiro) ? c.montoCorresponsal : null,
      }))
    }).pipe(finalize(() => this.savingRetiro = false)).subscribe({
      next: () => {
        this.showRetiroDialog = false;
        this.loadAll();
        this.msgSvc.add({ severity: 'success', summary: 'Solicitud enviada', detail: 'El retirador fue notificado.', life: 4000 });
      },
      error: () => this.msgSvc.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear la solicitud.' })
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

  estadoSeverity(estado: EstadoSolicitud): 'warning' | 'info' | 'success' {
    return estado === 'COMPLETADO' ? 'success' : estado === 'PENDIENTE' ? 'warning' : 'info';
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
