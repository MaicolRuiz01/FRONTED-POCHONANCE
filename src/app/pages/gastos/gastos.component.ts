import { Component } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { Router } from '@angular/router';
import { Table } from 'primeng/table';
import { SelectItem } from 'primeng/api';

@Component({
  selector: 'app-gastos',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './gastos.component.html',
  styleUrl: './gastos.component.css'
})
export class GastosComponent {
  product: any = {};
  products: any[] = [];
  paidProducts: any[] = [];
  submitted: boolean = false;
  productDialog: boolean = false;
  showAdditionalButtons: boolean = false; // Control de visibilidad para los botones adicionales
  actions: SelectItem[] = []; // Opciones del select
  selectedType: string = '';
  filteredProducts: any[] = [];

  constructor(private router: Router) {}

  ngOnInit() {
    this.products = [
      { date: new Date('2022-01-01'), description: 'Compra de Laptop', type: 'Operativo', cost: 1500 },
      { date: new Date('2022-01-05'), description: 'Mantenimiento de equipos', type: 'Operativo', cost: 300 },
      { date: new Date('2022-01-10'), description: 'Publicidad en redes', type: 'Otro', cost: 200 },
      { date: new Date('2022-01-15'), description: 'Servicios de hosting', type: 'Operativo', cost: 120 },
      { date: new Date('2022-01-20'), description: 'Compra de mobiliario', type: 'Otro', cost: 850 },
      { date: new Date('2022-01-25'), description: 'Pago de servicios básicos', type: 'Operativo', cost: 150 }
    ];

    this.paidProducts = [
      { paymentDate: new Date('2022-02-01'), description: 'Pago realizado', amount: 1500 },
      { paymentDate: new Date('2022-02-02'), description: 'Renovación de licencias', amount: 400 }
    ];
    this.actions = [
      {label: 'Operativo', value: 'Operativo'},
      {label: 'Otro', value: 'Otro'}
    ];

    this.filteredProducts = this.products; // Inicializa con todos los productos
  }

  toggleButtons() {
    this.showAdditionalButtons = !this.showAdditionalButtons;
  }

  openOperativo() {
    console.log('Acción para operativo');
    // Implementa la lógica para 'Operativo'
  }

  openOtro() {
    console.log('Acción para otro');
    // Implementa la lógica para 'Otro'
  }

  pay(product: any) {
    // Verifica si el producto es de tipo 'Operativo' antes de proceder
    if (product.type === 'Operativo') {
      console.log('Pago iniciado para:', product);
      // Aquí puedes mover el producto a la lista de pagados y quitarlo de la lista de pendientes
    } else {
      console.error('Acción no permitida: Este producto no es operativo.');
    }
  }
  filterByType() {
    if (!this.selectedType || this.selectedType === 'all') {
      this.filteredProducts = this.products;
    } else {
      this.filteredProducts = this.products.filter(p => p.type === this.selectedType);
    }
  }
  onDateFilter(table: Table, event: Event) {
    const date = (event.target as HTMLInputElement).value;
    table.filter(date, 'date', 'equals');
  }
}
