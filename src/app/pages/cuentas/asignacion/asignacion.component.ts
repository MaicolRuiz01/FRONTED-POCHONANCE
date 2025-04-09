import { Component } from '@angular/core';
import { SharedModule } from '../../../shared/shared.module';

@Component({
  selector: 'app-asignacion',
  standalone: true,
  imports: [SharedModule,],
  templateUrl: './asignacion.component.html',
  styleUrl: './asignacion.component.css'
})
export class AsignacionComponent {
  cols: any[]= [];
  products: any[] = [];
  selectedProducts: any[]= [];
  accordionHeaders = {
    compras: 'Compras',
    ventas: 'Ventas',
    p2p: 'P2P'
  };
  iconsVisibility = {
    compras: false,
    ventas: false,
    p2p: false
  };

  //modal compras
  displayModal: boolean = false;
  transactions = [
  { date: '10/01/2025 14:25:27', amount: 500, rate: 100 },
  { date: '09/01/2025', amount: 200, rate: 100 },
  { date: '09/01/2025', amount: 500, rate: 100 },
  { date: '09/01/2025', amount: 100, rate: 100 },
  { date: '09/01/2025', amount: 3000, rate: 100 },
  { date: '09/01/2025', amount: 5000, rate: 100 },
  { date: '09/01/2025', amount: 7000, rate: 100 },
  { date: '09/01/2025', amount: 8000, rate: 100 },
  { date: '09/01/2025', amount: 9000, rate: 100 },
  { date: '09/01/2025', amount: 154949, rate: 100 }
];

    //modal ventas
    displayModalVentas: boolean = false;

    //modal p2p
    displayAccountModal: boolean = false;
    cuentaSeleccionada: any = null;


    cuentas = [
      { id: 1, nombre: 'Cuenta Corriente 1234' },
      { id: 2, nombre: 'Cuenta Ahorros 5678' },
      { id: 3, nombre: 'Cuenta Empresa 9012' }
    ];

    //modal p2p de cambio
    showAdvancedView: boolean = false;
    input1Value: string = '';
    input2Value: string = '';
    select1Value: any;
    select2Value: any;

    // Asegúrate de tener estas propiedades definidas:
    otrasCuentas: any[] = []; // Tus otras cuentas diferentes



  ngOnInit() {
    this.cols = [
      { field: 'date', header: 'Fecha' },
      { field: 'account', header: 'Cuenta' },
      { field: 'amount', header: 'Monto' },
      { field: 'fee', header: 'Tasa' },
      { field: 'currency', header: 'Pesos' },
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



    changeHeader(tab: 'compras' | 'ventas' | 'p2p') {
      this.accordionHeaders = { ...this.accordionHeaders, [tab]: 'Por Asignar' };
      this.accordionHeaders[tab] = `${this.capitalize(tab)} <i class="pi pi-eye"></i>`;
    }

    toggleIconVisibility(tab: 'compras' | 'ventas' | 'p2p', isOpen: boolean) {
      this.iconsVisibility[tab] = isOpen;
    }

    capitalize(value: string): string {
      return value.charAt(0).toUpperCase() + value.slice(1);
    }

    resetHeader(tab: 'compras' | 'ventas' | 'p2p') {
      this.accordionHeaders = { ...this.accordionHeaders, [tab]: this.capitalize(tab) };
    }

    //modal compras
    showModalDialog() {
      this.displayModal = true;
    }

    //modal ventas
    showModalDialogVentas() {
      this.displayModalVentas = true;
    }

    //modal p2p
    showModalDialp2p() {
      this.displayAccountModal = true;
    }

        // Métodos adicionales
    guardarAvanzado() {
      // Lógica para guardar los datos de la vista avanzada
      this.showAdvancedView = false;
    }

    cancelar() {
      this.showAdvancedView = false;
      this.displayAccountModal = false;
    }

    confirmarCuenta() {
      // Lógica para confirmar según la vista actual
      if (this.showAdvancedView) {
        this.guardarAvanzado();
      }
      // Resto de tu lógica...
      this.displayAccountModal = false;
    }

}
