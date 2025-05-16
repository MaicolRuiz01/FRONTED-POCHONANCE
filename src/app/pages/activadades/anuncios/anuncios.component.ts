import { Component } from '@angular/core';
import { SharedModule } from '../../../shared/shared.module';
import { Router } from '@angular/router';

@Component({
  selector: 'app-anuncios',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './anuncios.component.html',
  styleUrl: './anuncios.component.css'
})
export class AnunciosComponent {
  cols: any[]= [];
      products: any[] = [];
      selectedProducts: any[]= [];

      constructor(private router: Router)   {}

      ngOnInit() {
        this.cols = [
          { field: 'date', header: 'Fecha' },
          { field: 'account', header: 'Cuenta' },
          { field: 'amount', header: 'Valor' },
          { field: 'fee', header: 'Tasa' },
          { field: 'currency', header: 'Pesos' },
          { field: 'currency', header: 'Estado' },
        ];

        this.products = [
          { orderNumber: 1, account: 'Main Account', amount: 1000, fee: 0.1, date: '2023-01-01', showButton: true },
          { orderNumber: 2, account: 'Savings Account', amount: 250000, fee: 0.05, date: '2023-02-15', showButton: true },
          { orderNumber: 3, account: 'Main Account', amount: 360000, fee: 0.2, date: '2023-03-10', showButton: true }
        ];
      }

      calculatePesos(product: any) {
        if (product.fee && product.amount) {
          product.currency = product.amount * product.fee; // Calcula el valor en pesos
          product.showButton = false; // Oculta el botón después del cálculo
        }
      }


  cards = [
    {
      name: 'Elva',
      cop: '4.300,05',
      usdtAmount: '14,1234',
      range: '2.000.000 - 20.600.000 COP',
      image: 'https://via.placeholder.com/150'
    },
    {
      name: 'Carlos Martínez',
      cop: '5.000,00',
      usdtAmount: '12,5431',
      range: '3.000.000 - 22.000.000 COP',
      image: 'https://via.placeholder.com/150'
    },
    {
      name: 'Ana García',
      cop: '3.250,15',
      usdtAmount: '9,2341',
      range: '1.500.000 - 18.000.000 COP',
      image: 'https://via.placeholder.com/150'
    },
    {
      name: 'Pedro López',
      cop: '7.100,99',
      usdtAmount: '20,8765',
      range: '4.000.000 - 25.000.000 COP',
      image: 'https://via.placeholder.com/150'
    },
    {
      name: 'Sofía Martínez',
      cop: '6.800,50',
      usdtAmount: '18,5674',
      range: '2.500.000 - 21.500.000 COP',
      image: 'https://via.placeholder.com/150'
    }
  ];


}
