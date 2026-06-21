import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { finalize } from 'rxjs/operators';

import { AnunciosService, AnuncioDto } from '../../../../core/services/anuncios.service';

@Component({
  selector: 'app-mis-anuncios',
  standalone: true,
  imports: [CommonModule, ButtonModule, TagModule, TooltipModule, ProgressSpinnerModule],
  templateUrl: './mis-anuncios.component.html',
  styleUrls: ['./mis-anuncios.component.css']
})
export class MisAnunciosComponent implements OnInit {

  anuncios: AnuncioDto[] = [];
  loading = false;
  ultimaActualizacion: string | null = null;

  constructor(private anunciosService: AnunciosService) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.loading = true;
    this.anunciosService.getMisAnuncios()
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: data => {
          this.anuncios = data;
          this.ultimaActualizacion = new Intl.DateTimeFormat('es-CO', {
            hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
          }).format(new Date());
        },
        error: () => { this.anuncios = []; }
      });
  }

  // ── Helpers de UI ──────────────────────────────────────────────

  tipoSeverity(tipo: string): 'success' | 'danger' {
    return tipo?.toUpperCase() === 'SELL' ? 'danger' : 'success';
  }

  tipoLabel(tipo: string): string {
    return tipo?.toUpperCase() === 'SELL' ? 'VENTA' : 'COMPRA';
  }

  fmtCop(valor: string): string {
    const n = parseFloat(valor);
    if (isNaN(n)) return valor ?? '—';
    return new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 }).format(n);
  }

  openBinance(advNo: string): void {
    if (advNo) window.open(`https://p2p.binance.com/es/advertiserDetail?advertiserNo=${advNo}`, '_blank');
  }
}
