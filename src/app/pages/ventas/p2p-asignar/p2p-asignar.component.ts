import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Table } from 'primeng/table';
import { SharedModule } from '../../../shared/shared.module';
import { P2pServiceService } from '../../../services/p2pservice/p2p-service.service';

@Component({
  selector: 'app-p2p-asignar',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './p2p-asignar.component.html',
  styleUrl: './p2p-asignar.component.css'
})
export class P2pAsignarComponent {

  cols: any[]= [];
  products: any[] = [];
  selectedProducts: any[]= [];

  constructor(private router: Router, private p2pService: P2pServiceService)   {}

  ngOnInit() {
    this.cols = [
      { field: 'orderNumber', header: 'Número Orden' },
      { field: 'tradeType', header: 'Tipo' },
      { field: 'amount', header: 'Cantidad' },
      { field: 'asset', header: 'Vendido' },
      { field: 'unitPrice', header: 'Tasa' },
      { field: 'createdTime', header: 'Fecha' },
      { field: 'commission', header: 'Comisión' },
      { field: 'accountName', header: 'Nombre de Cuenta' },
      { field: 'totalPrice', header: 'Cantidad pesos' },
      { field: 'asignarCuenta', header: 'ASignar Cuenta' }
    ];




    this.fetchP2POrders();
  }

  fetchP2POrders() {
    this.p2pService.getP2POrders("MILTON").subscribe({
      next: (response) => {
        console.log('Full response:', response); // Muestra la respuesta completa en la consola
        if (response && Array.isArray(response.data)) {
          // Asegúrate de transformar la fecha de milisegundos a formato legible
          const formattedData = response.data.map((item: { createTime: string | number | Date; }) => ({
            ...item,
            createdTime: new Date(item.createTime).toLocaleString() // Convertir el timestamp a fecha legible
          }));
          console.log('Data to be loaded in table:', formattedData); // Muestra los datos antes de cargarlos en la tabla
          this.products = formattedData;
        } else {
          console.error('Expected an object containing an array, but got:', typeof response);
          this.products = []; // Asegura que la tabla se limpie si la respuesta no es como se espera
        }
      },
      error: (error) => {
        console.error('Error fetching P2P orders:', error);
      }
    });
  }


  onDateFilter(table: Table, event: Event) {
    const date = (event.target as HTMLInputElement).value;
    table.filter(date, 'date', 'equals');
  }
}
