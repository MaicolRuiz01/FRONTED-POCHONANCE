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

  newCols: any[] = [
    { field: 'createdTime', header: 'Fecha' },
    { field: 'account', header: 'Cuenta' },
    { field: 'amount', header: 'Valor' },
    { field: 'unitPrice', header: 'Tasa' },
    { field: 'totalPrice', header: 'Pesos' },
    { field: 'details', header: 'Detalles', icon: true }
  ];

  newProducts: any[] = []; // Aquí irán los datos de la nueva tabla

  //menu
  selectedProduct: any;
  displayModal: boolean = false;
  filteredNewProducts: any[] = [];
  uniqueAccounts: string[] = [];


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
    this.newProducts = this.generateSampleData();
  }

  ngOnChanges(changes: SimpleChanges) {
    // Verifica si 'newProducts' ha cambiado y no es la primera carga
    if (changes['newProducts'] && !changes['newProducts'].isFirstChange()) {
      // Actualiza 'uniqueAccounts' cada vez que 'newProducts' cambia
      this.prepareNewTableData();
    }
  }

  prepareNewTableData() {
    // Asegúrate de que 'newProducts' está disponible
    if (this.newProducts) {
      this.uniqueAccounts = [...new Set(this.newProducts.map(product => product.account))];
      console.log('Updated uniqueAccounts:', this.uniqueAccounts); // Para depuración
    }
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
    const selectedAccount = (event.target as HTMLSelectElement).value;
    if (selectedAccount) {
      this.filteredNewProducts = this.newProducts.filter(product => product.account === selectedAccount);
    } else {
      this.filteredNewProducts = this.newProducts; // Si no se selecciona ninguna cuenta, muestra todos los productos
    }
  }



  generateSampleData() {
    const accountNames = ['Milton', 'Jose', 'Gonorrene']; // Nombres específicos para las cuentas
    const sampleData = [];
    for (let i = 0; i < 10; i++) {
      sampleData.push({
        createdTime: new Date().toISOString().slice(0, 10),
        account: this.getRandomAccountName(accountNames),
        amount: Math.floor(Math.random() * 10000 + 1000),
        unitPrice: (Math.random() * 10).toFixed(2),
        totalPrice: Math.floor(Math.random() * 100000 + 10000),
        details: ''
      });
    }
    return sampleData;
  }

  getRandomAccountName(accountNames: string[]) {
    const randomIndex = Math.floor(Math.random() * accountNames.length);
    return accountNames[randomIndex];
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
