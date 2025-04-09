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
  actions: SelectItem[] = []; // Opciones del select
  selectedType: string = '';
  filteredProducts: any[] = [];

  //modal nuevo
  displayModal: boolean = false;
  fecha: string = "";
  paymentDate: string = '';
  description: string = '';
  amount: number = 0;

  //segundo modal
  secondModalDisplay: boolean = false;


  //modal agregar operativo
  addExpenseModal: boolean = false;
  selectedFrequency: string = '';


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

    this.sortProducts();
  }

  //datos modal operativo
  operationalExpenses = [
    { name: 'Luz', value: 20000, frequency: 'Mensual' },
    { name: 'Internet', value: 50000, frequency: 'Quincenal' },
    { name: 'Agua', value: 15000, frequency: 'Anual' }
  ];



  sortProducts() {
    // Ordenar productos para que los 'Operativo' con botón "Paga" aparezcan primero
    this.products.sort((a, b) => {
      if (a.type === 'Operativo' && b.type !== 'Operativo') {
        return -1;
      } else if (a.type !== 'Operativo' && b.type === 'Operativo') {
        return 1;
      }
      return 0; // Mantener el orden original si ambos son 'Operativo' o ambos no lo son
    });
  }

  openAddExpenseModal() {
    this.secondModalDisplay = false; // Opcional: cerrar el modal actual
    this.addExpenseModal = true; // Abrir el nuevo modal
  }


  openModal() {
    this.displayModal = true;  // Esto activará el modal en la UI
  }

  saveExpense() {
    // Aquí agregarías la lógica para guardar el gasto en tus datos
    console.log('Gasto guardado:', this.paymentDate, this.description, this.amount);
    this.displayModal = false;  // Cerrar el modal después de guardar
  }

  manageOperative() {
    this.displayModal = false;  // Opcional: Cerrar el primer modal
    this.secondModalDisplay = true;  // Abrir el nuevo modal
  }

  //opertivo save

  frequencies = [
    { label: 'Mensual', value: 'Mensual' },
    { label: 'Quincenal', value: 'Quincenal' },
    { label: 'Anual', value: 'Anual' }
  ];


  saveExpense2() {
    console.log('Guardando gasto:', this.paymentDate, this.selectedFrequency, this.description, this.amount);
    // Agregar lógica para guardar los datos
    this.addExpenseModal = false; // Cerrar modal después de guardar
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
