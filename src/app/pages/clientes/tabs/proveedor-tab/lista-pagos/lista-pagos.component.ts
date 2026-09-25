import { Component, Input, Output, EventEmitter } from '@angular/core';
import { TableModule } from 'primeng/table';
import { CommonModule } from '@angular/common';
import { Movimiento } from '../../../../../core/services/pago-proveedor.service';
import { MovimientoService } from '../../../../../core/services/movimiento.service';
import { ButtonModule } from 'primeng/button';
import { NotificationService } from '../../../../../core/services/notification.service';
@Component({
  selector: 'app-lista-pagos',
  standalone: true,
  imports: [TableModule, CommonModule, ButtonModule],
  templateUrl: './lista-pagos.component.html',
 
})

export class ListaPagosComponent {
  @Input() pagos: any[] = [];
  /** Se emite tras eliminar un movimiento, para que el padre recargue saldos. */
  @Output() eliminado = new EventEmitter<void>();
  pagosOrdenados: any[] = [];
  eliminandoId: number | null = null;

  constructor(private movimientoService: MovimientoService,
    private notificationService: NotificationService) {}

  ngOnChanges() {
    this.pagosOrdenados = [...this.pagos].sort(
      (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
    );
  }

  /**
   * Cuánto quedó debiéndose DESPUÉS de este pago, en palabras. El backend guarda el saldo del
   * proveedor en ese momento (+ le debemos, − nos debe). Null en pagos anteriores al campo.
   */
  estadoDeuda(pago: any): { texto: string; monto: number | null } | null {
    const s = pago?.saldoProveedorResultante;
    if (s == null) return null;
    if (Math.abs(s) < 0.005) return { texto: 'A paz y salvo', monto: null };
    return s > 0
      ? { texto: 'Le quedamos debiendo', monto: s }
      : { texto: 'Nos queda debiendo', monto: -s };
  }

  eliminarMovimiento(movimiento: Movimiento): void {
    if (this.eliminandoId != null) return;
    if (!confirm('¿Estás seguro de que deseas eliminar este movimiento? Se devolverá el saldo afectado.')) {
      return; // el usuario canceló
    }
    this.eliminandoId = movimiento.id;
    this.movimientoService.eliminarMovimiento(movimiento).subscribe({
      next: () => {
        this.eliminandoId = null;
        this.pagosOrdenados = this.pagosOrdenados.filter(p => p !== movimiento);
        this.notificationService.success('Movimiento eliminado y saldo devuelto');
        this.eliminado.emit();
      },
      error: (err) => {
        this.eliminandoId = null;
        const msg = err?.error?.error || 'Error al eliminar el movimiento';
        this.notificationService.error(msg);
      }
    });
  }
}