import { Component } from '@angular/core';
import { SharedModule } from '../../../shared/shared.module';
import { Table } from 'primeng/table';
import { Router } from '@angular/router';

@Component({
  selector: 'app-otro',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './otro.component.html',
  styleUrls: ['./otro.component.css'] // Asegúrate de que el nombre de la propiedad es correcto, debe ser styleUrls en lugar de styleUrl
})
export class OtroComponent {
  products: any[] = [];
  paymentDialogVisible: boolean = false; // Variable para controlar la visibilidad del modal
  paymentDetails = {
    paymentDate: null,
    description: '',
    amount: null
  };

  constructor(private router: Router) {}

  ngOnInit() {
    this.products = [
      { date: new Date('2022-01-01'), description: 'Compra de Laptop', monto: 1500 },
    ];
  }

  openNew() {
    this.paymentDialogVisible = true; // Cambia la visibilidad a true
  }


  hideDialog() {
    this.paymentDialogVisible = false;
  }

  savePayment() {
    console.log('Payment Details:', this.paymentDetails);
    this.hideDialog();
    // Aquí iría la lógica para procesar el pago o enviar la información a un servidor
  }

  onDateFilter(table: Table, event: Event) {
    const date = (event.target as HTMLInputElement).value;
    table.filter(date, 'date', 'equals');
  }
}
