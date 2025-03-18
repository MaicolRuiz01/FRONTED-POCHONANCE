import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';
import { Table } from 'primeng/table';

@Component({
  selector: 'app-operativo',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './operativo.component.html',
  styleUrls: ['./operativo.component.css']
})
export class OperativoComponent {

  product: any = {};
  products: any[] = [];
  paidProducts: any[] = [];
  submitted: boolean = false;
  productDialog: boolean = false;

  constructor(private router: Router) {}

  ngOnInit() {
    this.products = [
        { date: new Date('2022-01-01'), description: 'Compra de Laptop', cost: 1500 },
    ];
    this.paidProducts = [
        { paymentDate: new Date('2022-02-01'), description: 'Pago realizado', amount: 1500 },
    ];
  }

  openNew() {
    this.product = {};
    this.submitted = false;
    this.productDialog = true;
}

  pay(product: any) {
    console.log('Pago iniciado para:', product);
    // Aquí puedes mover el producto a la lista de pagados y quitarlo de la lista de pendientes
  }

  onDateFilter(table: Table, event: Event) {
    const date = (event.target as HTMLInputElement).value;
    table.filter(date, 'date', 'equals');
  }
}
