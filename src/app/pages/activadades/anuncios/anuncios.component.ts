import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { CarouselModule } from 'primeng/carousel';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { SharedModule } from '../../../shared/shared.module';
import { AnunciosService, AnuncioDto } from '../../../core/services/anuncios.service';

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
  cols: any[] = [];
  products: any[] = [];
  selectedProducts: any[] = [];
  cards: any[] = [];
  carouselResponsiveOptions: any[] = [];

  constructor(private anunciosService: AnunciosService) {}

  ngOnInit(): void {
    this.cols = [
      { field: 'precio', header: 'Precio' },
      { field: 'moneda', header: 'Moneda' },
      { field: 'fiat', header: 'Fiat' },
      { field: 'minimo', header: 'Mínimo' },
      { field: 'maximo', header: 'Máximo' },
      { field: 'metodoPago', header: 'Método de Pago' },
      { field: 'vendedor', header: 'Vendedor' },
      { field: 'tipo', header: 'Tipo' }
    ];

    this.carouselResponsiveOptions = [
      { breakpoint: '1024px', numVisible: 3, numScroll: 1 },
      { breakpoint: '768px', numVisible: 2, numScroll: 1 },
      { breakpoint: '560px', numVisible: 1, numScroll: 1 }
    ];

    this.loadAnuncios();
  }

  loadAnuncios() {
    this.anunciosService.getAnuncios({
      asset: 'USDT',
      fiat: 'COP',
      payTypes: ['Nequi'],
      page: 1,
      rows: 20
    }).subscribe(data => {
      this.products = data.map(anuncio => ({
        ...anuncio,
        showButton: false
      }));

      this.cards = data.map(anuncio => ({
        name: anuncio.vendedor,
        cop: anuncio.precio,
        usdtAmount: '1',
        range: `Mín: ${anuncio.minimo} - Máx: ${anuncio.maximo}`
      }));
    });
  }

  calculatePesos(product: any) {
    const feeNumber = parseFloat(product.fee || '0');
    const precioNumber = parseFloat(product.precio || '0');
    if (!isNaN(feeNumber) && !isNaN(precioNumber)) {
      product.pesos = (feeNumber * precioNumber).toFixed(2);
    }
  }

  getNumVisible(): number {
    return 3;
  }

  getTableRows(): number {
    return 10;
  }

  getColumnClass(field: string): string {
    switch (field) {
      case 'precio':
      case 'moneda':
      case 'fiat':
        return 'col-code';
      case 'minimo':
      case 'maximo':
        return 'col-quantity';
      case 'metodoPago':
        return 'col-category';
      case 'vendedor':
        return 'col-name';
      default:
        return '';
    }
  }
}
