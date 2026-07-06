import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { finalize } from 'rxjs/operators';

import { SesionService, ResumenOperador } from '../../core/services/sesion.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-operadores',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, ButtonModule,
    CalendarModule, TagModule, ProgressSpinnerModule
  ],
  templateUrl: './operadores.component.html',
  styleUrls: ['./operadores.component.css']
})
export class OperadoresComponent implements OnInit {

  fecha: Date = new Date();
  resumen: ResumenOperador[] = [];
  loading = false;

  constructor(
    private sesionService: SesionService,
    private notification: NotificationService
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  /** Convierte la fecha seleccionada a 'YYYY-MM-DD' (hora local). */
  private fechaStr(): string {
    const d = this.fecha ?? new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  }

  cargar(): void {
    this.loading = true;
    this.sesionService.getResumen(this.fechaStr())
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: data => this.resumen = data ?? [],
        error: () => this.notification.error('No se pudo cargar el reporte de operadores.')
      });
  }

  onFechaChange(): void {
    this.cargar();
  }

  /** Segundos → "2 h 15 m" / "8 m 30 s" / "0 m". */
  formatTiempo(seg: number): string {
    const s = Math.max(0, Math.floor(seg ?? 0));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const rest = s % 60;
    if (h > 0) return `${h} h ${m} m`;
    if (m > 0) return `${m} m ${rest} s`;
    return `${rest} s`;
  }

  rolSeverity(rol: string | null): 'danger' | 'info' | 'secondary' {
    if (rol === 'ADMIN') return 'danger';
    if (rol === 'OPERARIO') return 'info';
    return 'secondary';
  }

  get totalIngresos(): number {
    return this.resumen.reduce((s, r) => s + (r.ingresos ?? 0), 0);
  }
}
