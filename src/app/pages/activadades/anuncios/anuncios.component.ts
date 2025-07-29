import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { CarouselModule } from 'primeng/carousel';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { SharedModule } from '../../../shared/shared.module';
import { AnunciosService, AnuncioDto } from '../../../core/services/anuncios.service';
import { OrderP2PService, OrderP2PDto } from '../../../core/services/orderp2p.service';
import { environment } from '../../../../environment/environment';

@Component({
  selector: 'app-anuncios',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    CarouselModule,
    InputTextModule,
    ButtonModule,
    SharedModule
  ],
  templateUrl: './anuncios.component.html',
  styleUrl: './anuncios.component.css'
})
export class AnunciosComponent implements OnInit {
  cards: any[] = [];
  carouselResponsiveOptions: any[] = [];
  ultimasOrdenes: OrderP2PDto[] = [];

  constructor(
    private anunciosService: AnunciosService,
    private orderP2PService: OrderP2PService
  ) {}

  ngOnInit(): void {
    this.carouselResponsiveOptions = [
      { breakpoint: '1024px', numVisible: 3, numScroll: 1 },
      { breakpoint: '768px', numVisible: 2, numScroll: 1 },
      { breakpoint: '560px', numVisible: 1, numScroll: 1 }
    ];

    this.loadAnuncios();           // Carrusel
    this.loadUltimasOrdenes();     // Tabla de órdenes
  }

  getNumVisible(): number {
    const width = window.innerWidth;
    if (width > 1024) return 3;
    if (width > 768) return 2;
    return 1;
  }

  loadAnuncios() {
    this.anunciosService.getAnuncios({
      asset: 'USDT',
      fiat: 'COP',
      payTypes: ['Nequi'],
      page: 1,
      rows: 20
    }).subscribe(data => {
      const agrupado = data.reduce((acc, anuncio) => {
        if (!acc[anuncio.cuenta]) {
          acc[anuncio.cuenta] = {
            cuenta: anuncio.cuenta,
            totalPrecio: 0,
            totalMinimo: 0,
            totalMaximo: 0
          };
        }
        acc[anuncio.cuenta].totalPrecio += parseFloat(anuncio.precio);
        acc[anuncio.cuenta].totalMinimo += parseFloat(anuncio.minimo);
        acc[anuncio.cuenta].totalMaximo += parseFloat(anuncio.maximo);
        return acc;
      }, {} as Record<string, { cuenta: string; totalPrecio: number; totalMinimo: number; totalMaximo: number }>);

      this.cards = Object.values(agrupado).map(item => ({
        name: item.cuenta,
        cop: item.totalPrecio.toFixed(2),
        usdtAmount: '1',
        range: `Mín: ${item.totalMinimo} - Máx: ${item.totalMaximo}`
      }));
    });
  }

  loadUltimasOrdenes(): void {
    this.orderP2PService.getUltimasOrdenesTodas(30).subscribe({
      next: (ordenes) => this.ultimasOrdenes = ordenes,
      error: (err) => console.error('Error cargando órdenes:', err)
    });
  }
}
