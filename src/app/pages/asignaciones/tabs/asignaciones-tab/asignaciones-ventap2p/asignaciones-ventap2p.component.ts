import { Component, OnInit } from '@angular/core';
import { SaleP2PService, SaleP2PDto } from '../../../../../core/services/sale-p2p.service';
import { AccountCopService, AccountCop } from '../../../../../core/services/account-cop.service';
import { AccountBinanceService, AccountBinance } from '../../../../../core/services/account-binance.service';
import { SupplierService, Supplier } from '../../../../../core/services/supplier.service';  

import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { MultiSelectModule } from 'primeng/multiselect';
import { RadioButtonModule } from 'primeng/radiobutton'; // Asegúrate de importar el módulo adecuado



@Component({
  selector: 'app-asignaciones-ventap2p',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    ButtonModule,
    FormsModule,
    DialogModule,
    DropdownModule,
    InputNumberModule,
     MultiSelectModule,
     RadioButtonModule 
  ],
  templateUrl: './asignaciones-ventap2p.component.html',
  styleUrls: ['./asignaciones-ventap2p.component.css']
})
export class AsignacionesVentap2pComponent implements OnInit {
  todaySales: SaleP2PDto[] = [];
  binanceAccounts: AccountBinance[] = [];
  selectedBinanceAccount: AccountBinance | null = null;
  cuentasDisponibles: AccountCop[] = [];
  selectedSale: SaleP2PDto | null = null;

  // Nuevo estado para la asignación
  isExternal: boolean = false;  // Si es externa o colombiana
  selectedAmount: number = 0;  // Monto ingresado por el usuario
  selectedAccounts: AccountCop[] = [];  // Cuentas seleccionadas
  displayAssignDialog: boolean = false;
  externalAccountName: string = '';
  noSalesMessage: string = '';

  constructor(
    private saleService: SaleP2PService,
    private accountBinanceService: AccountBinanceService,
    private accountCopService: AccountCopService,
    private supplierService: SupplierService
  ) {}

  ngOnInit(): void {
    this.loadBinanceAccounts();
    this.loadCuentas();
  }

  loadBinanceAccounts(): void {
    this.accountBinanceService.traerCuentas().subscribe({
      next: (accounts) => {
        this.binanceAccounts = accounts;
      },
      error: (err) => {
        console.error('Error al cargar las cuentas de Binance:', err);
      }
    });
  }

  loadCuentas(): void {
    this.accountCopService.getAll().subscribe({
      next: (accounts) => {
        this.cuentasDisponibles = accounts;
      },
      error: (err) => {
        console.error('Error al cargar las cuentas COP:', err);
      }
    });
  }

  loadTodaySales(): void {
  this.noSalesMessage = '';  // Reiniciar mensaje

  if (!this.selectedBinanceAccount) {
    alert("Por favor selecciona una cuenta de Binance.");
    return;
  }

  const accountName = this.selectedBinanceAccount.name;
  this.saleService.getAllSalesToday(accountName).subscribe({
    next: (sales) => {
      this.todaySales = sales;
      if (!sales || sales.length === 0) {
        this.noSalesMessage = 'No hay ventas p2p hechas el día de hoy';
      }
    },
    error: (err) => {
      console.error('Error al cargar las ventas del día:', err);
      this.noSalesMessage = 'Error al obtener ventas';
    }
  });
}


  openAssignDialog(sale: SaleP2PDto): void {
    this.selectedSale = sale;
    // Si la cuenta es externa, establecemos el nombre de la cuenta a la propiedad auxiliar
    if (this.isExternal) {
      this.externalAccountName = this.selectedSale?.nameAccount || '';
    }
    this.displayAssignDialog = true;
  }

  handleAssignType(): void {
    // Si es externa, le pedimos nombre de cuenta y monto, sino, mostramos cuentas colombianas
    if (this.isExternal) {
      this.selectedAccounts = [];
    } else {
      this.selectedAccounts = [];
    }
  }

assignAccounts(): void {
  if (!this.selectedSale) {
    alert("Por favor selecciona una venta.");
    return;
  }

  // Verifica si la cuenta es externa
  if (this.isExternal) {
    const accounts = [{
      amount: this.selectedAmount,
      nameAccount: this.selectedSale?.nameAccount || '', // Usamos el nombre de la cuenta de la venta
      accountCop: null // Cuenta externa, por lo que el accountCop es null
    }];
    this.submitAssignRequest(accounts); // Llamamos a la función para enviar la solicitud
  } else {
    // Verificamos si el monto no excede el saldo de la venta
    if (this.selectedAmount > this.selectedSale?.pesosCop) {
      alert("El monto no puede ser mayor al saldo de la venta.");
      return;
    }

    // Para cuentas colombianas, asignamos las cuentas seleccionadas
    const accounts = this.selectedAccounts.map(account => ({
      amount: this.selectedAmount,  // El monto a asignar
      nameAccount: account.name,  // El nombre de la cuenta COP seleccionada
      accountCop: account.id  // El ID de la cuenta COP seleccionada
    }));

    this.submitAssignRequest(accounts); // Llamamos a la función para enviar la solicitud
  }
}

// Función para enviar los datos al backend
submitAssignRequest(accounts: any): void {
  if (!this.selectedSale) {
    alert("Por favor selecciona una venta.");
    return;
  }

  this.saleService.assignAccounts(this.selectedSale.id, accounts).subscribe({
  next: () => {
    alert('Cuentas asignadas exitosamente.');  // ✅ Mensaje definido en el cliente
    this.displayAssignDialog = false;
    this.loadTodaySales();
  },
  error: (err) => {
    console.error('Error al asignar cuentas:', err);
    alert('Error al asignar las cuentas');
  }
});


}
}
