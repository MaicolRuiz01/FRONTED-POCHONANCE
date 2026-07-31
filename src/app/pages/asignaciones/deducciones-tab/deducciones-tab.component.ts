import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';

import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

import { DeduccionService, DeduccionDto } from '../../../core/services/deduccion.service';
import { AccountCopService, AccountCop } from '../../../core/services/account-cop.service';
import { AccountBinanceService, AccountBinance } from '../../../core/services/account-binance.service';
import { NotificationService } from '../../../core/services/notification.service';

/**
 * Deducciones — ventas P2P que se registran A MANO.
 *
 * Se usa cuando una venta P2P queda en "modo restricción" en Binance: el dinero sí cayó a
 * una cuenta COP, pero la orden nunca se completa y por eso no entra por el sync automático.
 *
 * No se guardan en la tabla de ventas P2P (esa sigue siendo el reflejo fiel de Binance),
 * pero sí suman al saldo de la cuenta COP indicada.
 */
@Component({
  selector: 'app-deducciones',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, DialogModule, ButtonModule,
    DropdownModule, InputTextModule, InputNumberModule, TooltipModule, ProgressSpinnerModule
  ],
  templateUrl: './deducciones-tab.component.html',
  styleUrls: ['./deducciones-tab.component.css']
})
export class DeduccionesComponent implements OnInit {

  deducciones: DeduccionDto[] = [];
  cuentasCop: AccountCop[] = [];
  cuentasBinance: AccountBinance[] = [];

  loading = false;
  guardando = false;
  eliminando = false;

  // ── Modal crear / editar ──
  dialogVisible = false;
  editandoId: number | null = null;
  form: DeduccionDto = this.formVacio();
  /** Se genera una por modal: si el operario da doble clic, el backend no duplica. */
  private idempotencyKey = '';
  /** Si el operario toca los pesos a mano, dejamos de recalcularlos por él. */
  private pesosEditadosAMano = false;

  // ── Confirmación de borrado ──
  confirmVisible = false;
  aEliminar: DeduccionDto | null = null;

  constructor(
    private deduccionService: DeduccionService,
    private accountCopService: AccountCopService,
    private accountBinanceService: AccountBinanceService,
    private notification: NotificationService
  ) {}

  ngOnInit(): void {
    this.cargar();
    this.accountCopService.getP2PView().subscribe({
      next: c => this.cuentasCop = c ?? []
    });
    this.accountBinanceService.traerCuentas().subscribe({
      next: a => this.cuentasBinance = (a ?? []).filter(x => x.tipo === 'BINANCE')
    });
  }

  cargar(): void {
    this.loading = true;
    this.deduccionService.listar()
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: d => this.deducciones = d ?? [],
        error: () => this.notification.error('No se pudieron cargar las deducciones.')
      });
  }

  // ── Modal ─────────────────────────────────────────────────────

  private formVacio(): DeduccionDto {
    return {
      accountBinanceId: null,
      accountCopId: null,
      dollarsUs: null,
      tasa: null,
      pesosCop: null,
      nota: ''
    };
  }

  abrirNueva(): void {
    this.editandoId = null;
    this.form = this.formVacio();
    this.pesosEditadosAMano = false;
    this.idempotencyKey = this.nuevaClave();
    this.dialogVisible = true;
  }

  abrirEditar(d: DeduccionDto): void {
    this.editandoId = d.id ?? null;
    this.form = { ...d };
    // Al editar respetamos el valor guardado: no lo pisamos con el cálculo.
    this.pesosEditadosAMano = true;
    this.dialogVisible = true;
  }

  /** USDT o tasa cambiaron → recalcular pesos, salvo que el operario ya los haya ajustado. */
  recalcularPesos(): void {
    if (this.pesosEditadosAMano) return;
    const usdt = Number(this.form.dollarsUs ?? 0);
    const tasa = Number(this.form.tasa ?? 0);
    this.form.pesosCop = (usdt > 0 && tasa > 0) ? Math.round(usdt * tasa) : null;
  }

  /** El operario tocó los pesos: desde acá mandan ellos. */
  pesosCambiadosAMano(): void {
    this.pesosEditadosAMano = true;
  }

  /** Vuelve a atar los pesos al cálculo usdt × tasa. */
  recalcularDeNuevo(): void {
    this.pesosEditadosAMano = false;
    this.recalcularPesos();
  }

  get pesosCalculados(): number | null {
    const usdt = Number(this.form.dollarsUs ?? 0);
    const tasa = Number(this.form.tasa ?? 0);
    return (usdt > 0 && tasa > 0) ? Math.round(usdt * tasa) : null;
  }

  /** True si el operario puso unos pesos distintos a usdt × tasa (para avisarle, no bloquearlo). */
  get pesosDifierenDelCalculo(): boolean {
    const calc = this.pesosCalculados;
    if (calc == null || this.form.pesosCop == null) return false;
    return Math.abs(calc - Number(this.form.pesosCop)) > 0.5;
  }

  guardar(): void {
    if (this.guardando) return;

    if (!this.form.accountCopId) {
      this.notification.warn('Selecciona la cuenta COP a la que cayó el dinero.');
      return;
    }
    if (!this.form.pesosCop || Number(this.form.pesosCop) <= 0) {
      this.notification.warn('Los pesos COP deben ser mayores que 0.');
      return;
    }

    this.guardando = true;

    const payload: DeduccionDto = {
      ...this.form,
      idempotencyKey: this.editandoId == null ? this.idempotencyKey : undefined
    };

    const req$ = this.editandoId == null
      ? this.deduccionService.crear(payload)
      : this.deduccionService.actualizar(this.editandoId, payload);

    req$.pipe(finalize(() => this.guardando = false)).subscribe({
      next: () => {
        this.notification.success(this.editandoId == null
          ? 'Deducción registrada. El saldo de la cuenta COP ya quedó sumado.'
          : 'Deducción actualizada. El saldo quedó ajustado.');
        this.dialogVisible = false;
        this.cargar();
      },
      error: err => this.notification.error(err?.error?.error || 'No se pudo guardar la deducción.')
    });
  }

  // ── Eliminar ──────────────────────────────────────────────────

  pedirEliminar(d: DeduccionDto): void {
    this.aEliminar = d;
    this.confirmVisible = true;
  }

  confirmarEliminar(): void {
    if (!this.aEliminar?.id || this.eliminando) return;
    this.eliminando = true;
    this.deduccionService.eliminar(this.aEliminar.id)
      .pipe(finalize(() => this.eliminando = false))
      .subscribe({
        next: () => {
          this.notification.success('Deducción eliminada. El saldo de la cuenta COP se revirtió.');
          this.confirmVisible = false;
          this.aEliminar = null;
          this.cargar();
        },
        error: err => this.notification.error(err?.error?.error || 'No se pudo eliminar.')
      });
  }

  // ── Helpers ───────────────────────────────────────────────────

  get totalPesos(): number {
    return this.deducciones.reduce((s, d) => s + Number(d.pesosCop ?? 0), 0);
  }

  private nuevaClave(): string {
    return 'ded-' + Date.now() + '-' + Math.random().toString(36).slice(2, 10);
  }

  trackById = (_: number, d: DeduccionDto) => d.id;
}
