import { Component, Input } from '@angular/core';
import { TableModule } from 'primeng/table';
import { CommonModule } from '@angular/common';
import { Movimiento } from '../../../../../core/services/pago-proveedor.service';
import { MovimientoService } from '../../../../../core/services/movimiento.service';
import { ButtonModule } from 'primeng/button';
@Component({
  selector: 'app-lista-pagos',
  standalone: true,
  imports: [TableModule, CommonModule, ButtonModule],
  templateUrl: './lista-pagos.component.html',
 
})

export class ListaPagosComponent {
  @Input() pagos: any[] = []; 
  pagosOrdenados: any[] = [];

  constructor(private movimientoService: MovimientoService,
  ) {}

  ngOnChanges() {
    this.pagosOrdenados = [...this.pagos].sort(
      (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
    );
  }

  eliminarMovimiento(movimiento: Movimiento): void {
  if(!confirm('¿Estás seguro de que deseas eliminar este movimiento?')) {
   
  this.movimientoService.eliminarMovimiento(movimiento).subscribe({
    next: () => {
      this.pagosOrdenados = this.pagosOrdenados.filter(p => p !== movimiento);
    },
    error: () => alert('Error al eliminar el movimiento')
  });
}
  }
}