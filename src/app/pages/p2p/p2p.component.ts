import { Component, SimpleChanges } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { Router } from '@angular/router';
import { Table } from 'primeng/table';
import { P2pServiceService } from '../../core/services/p2p-service.service';

@Component({
  selector: 'app-p2p',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './p2p.component.html',
  styleUrl: './p2p.component.css'
})
export class P2pComponent {

  cols: any[]= [];
  products: any[] = [];
  selectedProducts: any[]= [];

  startDateFilter: Date | null = null;
  endDateFilter: Date | null = null;
  maxDate: string = ""; // Variable para almacenar la fecha máxima permitida


  //menu
  selectedProduct: any;
  displayModal: boolean = false;
  filteredNewProducts: any[] = [];



  constructor(private router: Router, private p2pService: P2pServiceService)   {}

  ngOnInit() {
    this.maxDate = new Date().toISOString().split('T')[0];
    this.cols = [
      { field: 'orderNumber', header: 'Número Orden' },
      { field: 'account', header: 'Cuenta' },
      { field: 'tradeType', header: 'Tipo' },
      { field: 'amount', header: 'Cantidad' },
      { field: 'asset', header: 'Vendido' },
      { field: 'unitPrice', header: 'Tasa' },
      { field: 'createdTime', header: 'Fecha' },
      { field: 'commission', header: 'Comisión' },
      { field: 'accountName', header: 'Nombre de Cuenta' },
      { field: 'totalPrice', header: 'Cantidad pesos' },


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

  onDateFilterStart(event: Event) {
    this.startDateFilter = (event.target as HTMLInputElement).valueAsDate;
    this.applyDateFilters();
  }

  onDateFilterEnd(event: Event) {
    this.endDateFilter = (event.target as HTMLInputElement).valueAsDate;
    this.applyDateFilters();
  }

  applyDateFilters() {
    if (this.startDateFilter && this.endDateFilter) {
      // Convertir fechas a string ISO para la consulta API
      const startDate = this.startDateFilter.toISOString().split('T')[0]; // formato 'yyyy-mm-dd'
      const endDate = this.endDateFilter.toISOString().split('T')[0];

      this.p2pService.getOrdersByDateRange("MILTON", startDate, endDate).subscribe({
        next: (response) => {
          this.products = response.map((item: any) => ({
            ...item,
            createdTime: new Date(item.createTime).toLocaleString()
          }));
        },
        error: (error) => console.error('Error fetching orders by date range:', error)
      });
    }
  }
  onTradeTypeFilter(table: Table, event: Event) {
    const tradeType = (event.target as HTMLInputElement).value;
    table.filter(tradeType, 'tradeType', 'contains');
  }

  onAccountNameFilter(table: Table, event: Event) {
    const accountName = (event.target as HTMLInputElement).value;
    table.filter(accountName, 'accountName', 'contains');
  }



  onBinanceFilter() {
    // Implementa la lógica para filtrar por Binance
    console.log("Filtrando por Binance");
    // Puedes llamar a p2pService o filtrar 'newProducts' directamente aquí
  }

  onAccountFilter(event: Event) {

  }


 //menu
  onShowDetails(rowData: any) {
    this.selectedProduct = rowData;
    this.displayModal = true; // Abre el modal
    console.log('Mostrando detalles para:', rowData);
  }
  onSelectAccount(event: Event) {
    const selectedValue = (event.target as HTMLSelectElement).value;
    console.log('Cuenta seleccionada:', selectedValue);
    // Aquí puedes implementar cualquier lógica adicional basada en la cuenta seleccionada
  }


}