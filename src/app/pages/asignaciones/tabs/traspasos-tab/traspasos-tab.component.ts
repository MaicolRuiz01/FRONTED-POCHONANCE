import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { TraspasosService, TraspasoItem } from '../../../../core/services/traspasos.service';

/**
 * Tab "TRASPASOS" (Asignar → Traspasos).
 * Lista TODOS los traspasos paginados del lado del servidor (lazy load): solo pide la página
 * visible, con una proyección liviana (de, a, fecha, cantidad, moneda), para que cargue rápido
 * aunque haya muchos registros.
 */
@Component({
  selector: 'app-traspasos-tab',
  standalone: true,
  imports: [CommonModule, TableModule],
  templateUrl: './traspasos-tab.component.html',
  styleUrls: ['./traspasos-tab.component.css']
})
export class TraspasosTabComponent {
  traspasos: TraspasoItem[] = [];
  total = 0;
  loading = false;
  rows = 20;

  constructor(private traspasosService: TraspasosService) {}

  /** Lo dispara el propio p-table (onLazyLoad) al iniciar y al cambiar de página. */
  load(event: any): void {
    const size = event?.rows ?? this.rows;
    const first = event?.first ?? 0;
    const page = size > 0 ? Math.floor(first / size) : 0;

    this.loading = true;
    this.traspasosService.getTraspasosPaginados(page, size).subscribe({
      next: resp => {
        this.traspasos = resp.content ?? [];
        this.total = resp.totalElements ?? 0;
        this.loading = false;
      },
      error: () => {
        this.traspasos = [];
        this.loading = false;
      }
    });
  }
}
