import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { finalize } from 'rxjs/operators';

import {
  TasaPromedioDiagnosticoService,
  TasaPromedioDiagnostico
} from '../../core/services/tasa-promedio-diagnostico.service';

/**
 * Diagnóstico de la tasa promedio (solo ADMIN).
 *
 * Muestra, para cada recálculo, con qué números se hizo: qué compra lo provocó, qué saldo se
 * leyó de Binance, qué base se usó y qué tasa quedó. Sirve para ver EN QUÉ COMPRA se desvía
 * la tasa, en vez de tener que deducirlo.
 *
 * Es una vista de solo lectura: no dispara ningún cálculo ni modifica nada.
 */
@Component({
  selector: 'app-tasa-promedio',
  standalone: true,
  imports: [CommonModule, TableModule, ButtonModule, TagModule, TooltipModule, ProgressSpinnerModule],
  templateUrl: './tasa-promedio.component.html',
  styleUrls: ['./tasa-promedio.component.css']
})
export class TasaPromedioComponent implements OnInit {

  filas: TasaPromedioDiagnostico[] = [];
  loading = false;
  error = false;

  /** Fila desplegada para ver el detalle completo del cálculo. */
  expandidaId: number | null = null;

  constructor(private service: TasaPromedioDiagnosticoService) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.loading = true;
    this.error = false;
    this.service.listar()
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: d => this.filas = d ?? [],
        error: () => this.error = true
      });
  }

  toggleDetalle(f: TasaPromedioDiagnostico): void {
    this.expandidaId = this.expandidaId === f.id ? null : f.id;
  }

  /** Cuánto se movió la tasa en este paso. */
  variacion(f: TasaPromedioDiagnostico): number | null {
    if (f.tasaAnterior == null || f.tasaResultante == null) return null;
    return f.tasaResultante - f.tasaAnterior;
  }

  /**
   * Verifica que la aritmética cierre: la tasa resultante debe ser totalPesos / totalUsdt.
   * Si NO cierra, el problema está en la fórmula. Si cierra pero el número igual se siente
   * mal, el problema está en los datos de entrada (típicamente el saldo base).
   */
  cuadra(f: TasaPromedioDiagnostico): boolean | null {
    if (f.totalPesos == null || f.totalUsdt == null || !f.totalUsdt || f.tasaResultante == null) return null;
    const esperado = f.totalPesos / f.totalUsdt;
    return Math.abs(esperado - f.tasaResultante) < 0.5;
  }

  /**
   * Cuánto cambió el saldo leído de Binance respecto al recálculo anterior, descontando
   * la compra. Si esto NO es cero, el "inventario" se movió por sí solo —por precios de otras
   * monedas o por ventas— y eso es exactamente lo que ensucia la tasa.
   */
  derivaSaldo(f: TasaPromedioDiagnostico, i: number): number | null {
    const anterior = this.filas[i + 1]; // la lista viene de más reciente a más viejo
    if (!anterior || f.saldoExternoLeido == null || anterior.saldoExternoLeido == null) return null;
    return f.saldoExternoLeido - anterior.saldoExternoLeido;
  }

  eventoSeverity(evento: string): 'info' | 'success' {
    return evento === 'APERTURA_SESION' ? 'info' : 'success';
  }

  eventoLabel(evento: string): string {
    return evento === 'APERTURA_SESION' ? 'Abrió sesión' : 'Se licuó';
  }

  /** Filas donde la base se perdió: son las que producen los saltos bruscos. */
  get conBaseRecortada(): number {
    return this.filas.filter(f => f.baseRecortadaACero).length;
  }

  /** Filas donde la aritmética NO cierra. */
  get conErrorAritmetico(): number {
    return this.filas.filter(f => this.cuadra(f) === false).length;
  }

  trackById = (_: number, f: TasaPromedioDiagnostico) => f.id;
}
