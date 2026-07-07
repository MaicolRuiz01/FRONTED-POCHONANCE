import { Component, OnInit } from '@angular/core';
import { Caja, CajaService } from '../../../../core/services/caja.service';
import { MovimientoService, MovimientoAjusteDto } from '../../../../core/services/movimiento.service';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe, CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { TabViewModule } from 'primeng/tabview';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { InputNumberModule } from 'primeng/inputnumber';
import { AjusteSaldoDialogComponent } from '../../../../shared/ajustes-saldo/ajuste-saldo-dialog.component';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip';
import { GastoService } from '../../../../core/services/gasto.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-cajas-tab',
  standalone: true,
  imports: [
    FormsModule, ButtonModule, InputTextModule, DialogModule, TabViewModule,
    TableModule, CurrencyPipe, CardModule, InputNumberModule, CommonModule,
    ProgressSpinnerModule, TooltipModule,
    AjusteSaldoDialogComponent
  ],
  templateUrl: './cajas.component.html',
  styleUrls: ['./cajas.component.css']   // 👈 corregido (plural)
})
export class CajasComponent implements OnInit {

  cajas: Caja[] = [];
  displayCajaDialog = false;
  nuevaCaja: Partial<Caja> = { name: '', saldo: 0 };
  showAjusteCaja = false;
  cajaAjuste: Caja | null = null;

  // 🔹 NUEVO: estado para ver movimientos de una caja
  showMovsDialog = false;
  cajaSeleccionada: Caja | null = null;
  movimientosCaja: any[] = [];
  loadingMovs = false;

  ajustesCaja: MovimientoAjusteDto[] = [];
  loadingAjustesCaja = false;

  constructor(
    private movimientoService: MovimientoService,
    private cajaService: CajaService,
    private gastoService: GastoService
  ,
    private notificationService: NotificationService
) { }

  ngOnInit(): void {
    this.loadCajas();
  }

  loadCajas() {
    this.cajaService.listar().subscribe(data => {
      this.cajas = data;

      this.cajas.forEach(caja => {
        if (!caja.id) return;

        this.gastoService.getTotalGastosHoyCaja(caja.id).subscribe(total => {
          caja.gastosHoy = total;
        });
      });
    });
  }


  get totalCajas(): number {
    return this.cajas.reduce((acc, caja) => acc + (caja.saldo ?? 0), 0);
  }

  guardarCaja() {
    if (!this.nuevaCaja.name || this.nuevaCaja.saldo === undefined) return;

    this.cajaService.crear(this.nuevaCaja).subscribe({
      next: caja => {
        this.cajas.push(caja);
        this.displayCajaDialog = false;
        this.nuevaCaja = { name: '', saldo: 0 };
      },
      error: () => this.notificationService.error('Error al guardar caja')
    });
  }

  abrirAjusteCaja(caja: Caja) {
    this.cajaAjuste = caja;
    this.showAjusteCaja = true;
  }

  // ── Eliminar caja ──────────────────────────────────────────────
  eliminarCaja(caja: Caja, event: Event) {
    event.stopPropagation(); // que no abra el modal de movimientos
    if (!caja?.id) return;
    if (!confirm(`¿Eliminar la caja "${caja.name}"? No se puede si tiene movimientos o gastos asociados.`)) return;
    this.cajaService.eliminar(caja.id).subscribe({
      next: () => {
        this.cajas = this.cajas.filter(c => c.id !== caja.id);
        this.notificationService.success('Caja eliminada');
      },
      error: (err) => this.notificationService.error(err?.error?.error || 'No se pudo eliminar la caja.')
    });
  }

  // ── Eliminar un movimiento de la caja (con reversa de saldos/cupo) ──
  /** Solo mostramos el botón para los tipos que el backend sabe revertir. */
  esEliminable(mov: any): boolean {
    const t = (mov?.tipo || '').toUpperCase();
    return t.startsWith('RETIRO') || t === 'PAGO PROVEEDOR' || t === 'TRANSFERENCIA CAJA';
  }

  eliminarMovimientoCaja(mov: any) {
    if (!mov?.id) return;
    if (!confirm('¿Eliminar este movimiento? Se revertirán los saldos (y el cupo, si es un retiro de hoy).')) return;
    this.movimientoService.eliminarMovimiento(mov).subscribe({
      next: () => {
        this.movimientosCaja = this.movimientosCaja.filter(m => m.id !== mov.id);
        this.loadCajas(); // los saldos cambiaron con la reversa
        this.notificationService.success('Movimiento eliminado y saldos revertidos');
      },
      error: (err) => this.notificationService.error(err?.error?.error || 'No se pudo eliminar el movimiento.')
    });
  }

  onAjusteCajaRealizado() {
    this.loadCajas(); // refresca saldos después del ajuste
  }

  // 🔹 NUEVO: abrir modal y cargar movimientos por caja
  verMovimientos(caja: Caja) {
    if (!caja?.id) return;
    this.cajaSeleccionada = caja;
    this.movimientosCaja = [];
    this.loadingMovs = true;
    this.showMovsDialog = true;

    this.movimientoService.getMovimientosPorCaja(caja.id).subscribe({
      next: data => {
        // ordenar más reciente primero (por si el backend no lo hace)
        this.movimientosCaja = [...data].sort(
          (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
        );
      },
      error: e => console.error('Error al cargar movimientos de caja', e),
      complete: () => this.loadingMovs = false
    });

    this.movimientoService.getAjustesCaja(caja.id).subscribe({
      next: ajustes => {
        this.ajustesCaja = [...ajustes].sort(
          (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
        );
      },
      error: e => console.error('Error al cargar ajustes de caja', e),
      complete: () => this.loadingAjustesCaja = false
    });
  }
}
