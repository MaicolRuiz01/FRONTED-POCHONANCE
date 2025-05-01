import { Component, ViewChild } from '@angular/core';
import { SharedModule } from '../../../shared/shared.module';
import { MenuItem } from 'primeng/api';
import { Menu } from 'primeng/menu';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-asignacion',
  standalone: true,
  imports: [SharedModule,],
  templateUrl: './asignacion.component.html',

})
export class AsignacionComponent {

  orders: any[] = [];  // Aquí se almacenarán todas las órdenes combinadas
  error: string = '';  // Variable para manejar los errores
  loading: boolean = false;  // Indicador de carga

 // Cuentas para las que vamos a obtener las órdenes
 accounts: string[] = ['MILTON', 'CESAR', 'MARCEL'];


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
  //agregar modal
  displayModalAgg: boolean = false;
  fecha: string = "";
  monto: number = 0;
  tasaCompra: number = 0;
  tasaVenta: number = 0;

  // En la sección de propiedades de la clase
  p2pCols: any[] = [];
  p2pTransactions: any[] = [];
  selectedP2PTransactions: any[] = [];

  //modal compras
  displayModal: boolean = false;
  transactions = [
  { date: '10/01/2025 14:25:27', amount: 500, rate: 100, pesos: 300, cuenta: 'milton'},
  { date: '09/01/2025', amount: 200, rate: 100, pesos: 300, cuenta: 'milton' },
  { date: '09/01/2025', amount: 500, rate: 100, pesos: 300, cuenta: 'milton' },
  { date: '09/01/2025', amount: 100, rate: 100, pesos: 300, cuenta: 'milton' },
  { date: '09/01/2025', amount: 3000, rate: 100, pesos: 300, cuenta: 'milton' },
  { date: '09/01/2025', amount: 5000, rate: 100, pesos: 300, cuenta: 'milton' },
  { date: '09/01/2025', amount: 7000, rate: 100, pesos: 300, cuenta: 'milton' },
  { date: '09/01/2025', amount: 8000, rate: 100, pesos: 300, cuenta: 'milton' },
  { date: '09/01/2025', amount: 9000, rate: 100, pesos: 300, cuenta: 'milton' },
  { date: '09/01/2025', amount: 154949, rate: 100, pesos: 300, cuenta: 'milton' }
];

  menuX: number = 0;
  menuY: number = 0;
  menuItems: MenuItem[] = [];

  showMenu(event: MouseEvent, expense: any) {
    event.stopPropagation(); // Evita que se propague el clic

    this.menuX = event.clientX;
  this.menuY = event.clientY;

    this.menuItems = [
      { label: `Pesos: ${expense.pesos}`, disabled: true,  styleClass: 'black-bg'   },
      { label: `Cuenta: ${expense.cuenta}`, disabled: true, styleClass: 'yellow-bg' }
    ];

    // Muestra el menú en la posición del clic
    this.menu.toggle(event);
  }

  @ViewChild('menu') menu!: Menu;

    //modal ventas
    displayModalVentas: boolean = false;
    transactionsSells = [
      { date: '10/01/2025 14:25:27', amount: 500,account: 'jesus' , rate: 100,  pesos: 520000, tipo: 'anal',utilidad: 20},
      { date: '09/01/2025', account: 'Jose', amount: 200, rate: 100, pesos: 520000, tipo: 'anal',utilidad: 20},
      { date: '09/01/2025', account: 'jesus' , amount: 500, rate: 100,  pesos: 520000, tipo: 'anal',utilidad: 20},
      { date: '09/01/2025', account: 'Jose',  amount: 100, rate: 100,  pesos: 520000, tipo: 'anal',utilidad: 20},
      { date: '09/01/2025',account: 'jesus', amount: 3000, rate: 100,  pesos: 520000, tipo: 'anal',utilidad: 20 },
      { date: '09/01/2025', account: 'Jose', amount: 5000, rate: 100, pesos: 520000, tipo: 'anal',utilidad: 20},

    ];

    // Variables adicionales para ventas
menuSellsItems: MenuItem[] = [];
@ViewChild('menuVentas') menuVentas!: Menu;

// Método para mostrar el menú en ventas
showSellsMenu(event: MouseEvent, expense: any) {
  event.stopPropagation();

  // Posición del menú
  this.menuX = event.clientX;
  this.menuY = event.clientY;

  // Ítems del menú con estilos (reutilizando las clases CSS existentes)
  this.menuSellsItems = [
    {
      label: `Pesos: ${expense.pesos}`,
      escape: false,
      disabled: true,
      styleClass:'yellow-bg' // Fondo negro, texto blanco
    },
    {
      label: `Tipo: ${expense.tipo}`,
      escape: false,
      disabled: true,
      styleClass: 'black-bg'   // Fondo amarillo, texto negro
    },
    {
      label: `Utilidad: ${expense.utilidad}`,
      escape: false,
      disabled: true,
      styleClass: 'yellow-bg'  // Reutiliza el mismo estilo
    }
  ];

  // Mostrar menú
  this.menuVentas.toggle(event);
}


    //modal p2p tabla
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

    //modalp2p ojo
    displayModalp2p: boolean = false;
    menuP2PItems: MenuItem[] = [];

    transactionData = [
      { date: '10/01/2025 14:25:27', account: 'jesus', amount: 500, pesos: 520000, asignada: 'pene feliz', tasa:35 },
      { date: '09/01/2025', account: 'Jose', amount: 200, pesos: 520000, asignada: 'pene feliz', tasa:35 },
      { date: '09/01/2025', account: 'jesus', amount: 500, pesos: 520000, asignada: 'pene feliz', tasa:35 },
      // Agrega más datos según necesites
    ];

    @ViewChild('menuP2P') menuP2P!: Menu;

showP2PMenu(event: MouseEvent, transaction: any) {
  event.stopPropagation();

  // Posición del menú
  this.menuX = event.clientX;
  this.menuY = event.clientY;

  // Ítems del menú con estilos (reutilizando clases CSS existentes)
  this.menuP2PItems = [
    {
      label: `Asignada: ${transaction.asignada}`,
      escape: false,
      disabled: true,
      styleClass: 'black-bg'  // Fondo negro, texto blanco
    },
    {
      label: `Tasa: ${transaction.tasa}`,
      escape: false,
      disabled: true,
      styleClass: 'yellow-bg'  // Fondo amarillo, texto negro
    }
  ];

  // Mostrar menú
  this.menuP2P.toggle(event);
}

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

    this.p2pCols = [
      { field: 'fecha', header: 'Fecha' },
      { field: 'cuenta', header: 'Cuenta' },
      { field: 'monto', header: 'Monto' },
      { field: 'pesos', header: 'Pesos' },
      { field: 'vacia', header: '' } // Columna vacía
    ];

    this.p2pTransactions = [
      {
        id: 1,
        fecha: new Date('2023-01-01'),
        cuenta: 'Cuenta Principal',
        monto: 1000,
        pesos: 50000,
        moneda: 'USD'
      },
      {
        id: 2,
        fecha: new Date('2023-02-15'),
        cuenta: 'Cuenta de Ahorros',
        monto: 250000,
        pesos: 12500000,
        moneda: 'COP'
      },
      {
        id: 3,
        fecha: new Date('2023-03-10'),
        cuenta: 'Cuenta Principal',
        monto: 360000,
        pesos: 18000000,
        moneda: 'COP'
      }
    ];
    this.getP2POrdersForAllAccounts();
  }

  //uso del service
  getP2POrdersForAllAccounts(): void {
    this.loading = true;  // Inicia el indicador de carga

   /*  // Creamos un array de observables para todas las cuentas
    const requests = this.accounts.map(account =>
      this.orderP2pService.(account)
    );

    // Ejecutamos todas las solicitudes de forma paralela
    // Utilizamos 'forkJoin' de RxJS para combinar las respuestas de todas las solicitudes
    forkJoin(requests).subscribe(
      (results) => {
        // Combina los resultados de todas las cuentas
        this.orders = results.flat();  // 'flat' aplana un array de arrays en uno solo
        this.loading = false;  // Finaliza el indicador de carga
      },
      (error) => {
        this.error = 'Error al obtener las órdenes P2P';  // Maneja el error
        this.loading = false;  // Finaliza el indicador de carga
        console.error(error);  // Imprime el error en consola
      }
    );
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

    //modal p2p eye
    showModalp2p() {
      this.displayModalp2p = true;
    }

    //modal agregar ventas
    save() {
      const newSale = {
        fecha: this.fecha,
        monto: this.monto,
        tasaCompra: this.tasaCompra,
        tasaVenta: this.tasaVenta
      };
      // Aquí podrías añadir la nueva venta a un array de ventas o enviarla a un servidor
      console.log(newSale);
      this.displayModal = false; // Cerrar el modal
    } */

}}
