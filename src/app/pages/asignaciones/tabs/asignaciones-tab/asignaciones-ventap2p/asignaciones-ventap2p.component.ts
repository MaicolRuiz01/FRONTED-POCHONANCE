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
import { InputTextModule } from 'primeng/inputtext';


import {ProgressSpinnerModule} from 'primeng/progressspinner';
import { TableColumn } from '../../../../../shared/mi-table/mi-table.component';
import { MiTableComponent } from '../../../../../shared/mi-table/mi-table.component';
import { CardListComponent } from '../../../../../shared/mi-card/mi-card.component';


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
    RadioButtonModule,
    InputTextModule,
    ProgressSpinnerModule,
    MiTableComponent,
    CardListComponent
  ],
  templateUrl: './asignaciones-ventap2p.component.html',
  styleUrls: ['./asignaciones-ventap2p.component.css']
})
export class AsignacionesVentap2pComponent implements OnInit {
  todaySales: SaleP2PDto[] = [];
  allAccountsp2p: SaleP2PDto[] = [];
  binanceAccounts: AccountBinance[] = [];
  selectedBinanceAccount: AccountBinance | null = null;
  cuentasDisponibles: AccountCop[] = [];
  selectedSale: SaleP2PDto | null = null;
  externalAmount: number = 0;

  // Nuevo estado para la asignación
  isExternal: boolean = false;  // Si es externa o colombiana
  selectedAssignments: { account: AccountCop; amount: number }[] = [];
  displayAssignDialog: boolean = false;
  externalAccountName: string = '';
  noSalesMessage: string = '';
  loading: boolean = false;
  isMobile: boolean = false;
  selectedAccounts: AccountCop[] = [];


  //componnete reutilizable de la tabla
  columns: TableColumn[] = [
    { campo: 'id', columna: 'N° de orden' },
    { campo: 'date', columna: 'Fecha' },
    { campo: 'dollarsUs', columna: 'Dolares' },
    { campo: 'pesosCop', columna: 'Pesos COP' },
    { campo: 'commission', columna: 'Comision' }
  ];

  constructor(
    private saleService: SaleP2PService,
    private accountBinanceService: AccountBinanceService,
    private accountCopService: AccountCopService,
    private supplierService: SupplierService
  ) {}

  ngOnInit(): void {
  this.loadNoAsignadas();
  this.isMobile = window.innerWidth <= 768;
  window.addEventListener('resize', () => {
    this.isMobile = window.innerWidth <= 768;
  });
}
  openAssignDialog(sale: SaleP2PDto): void {
  this.selectedSale = sale;
  this.displayAssignDialog = true;

  this.externalAccountName = '';
  this.externalAmount = 0;
  this.selectedAssignments = [];
  this.selectedAccounts = [];
  this.isExternal = false;

  // ✅ Cargar cuentas COP para el multiselect
  this.loadCuentasCop();
}



  handleAssignType(): void {
    if (this.isExternal) {
      this.externalAccountName = '';
    } else {
      this.selectedAssignments = [];
    }
  }

  onAccountsChange(): void {
  const ventaCop = Number(this.selectedSale?.pesosCop ?? 0);

  // si hay 1 sola cuenta seleccionada => le ponemos TODO el valor de la venta
  // si hay varias => por defecto quedan en 0 (para que el usuario reparta)
  const defaultAmount = (this.selectedAccounts.length === 1) ? ventaCop : 0;

  this.selectedAssignments = this.selectedAccounts.map(account => {
    const existing = this.selectedAssignments.find(a => a.account.id === account.id);

    return {
      account,
      amount: existing ? existing.amount : defaultAmount
    };
  });
}

  private loadCuentasCop(): void {
  this.accountCopService.getAll().subscribe({
    next: (cuentas) => {
      this.cuentasDisponibles = cuentas ?? [];
    },
    error: (err) => {
      console.error('Error cargando cuentas COP:', err);
      this.cuentasDisponibles = [];
    }
  });
}



  assignAccounts(): void {
    if (!this.selectedSale) {
      alert("Por favor selecciona una venta.");
      return;
    }

    if (this.isExternal) {
      const accounts = [{
        amount: this.externalAmount,
        nameAccount: this.externalAccountName || '',
        accountCop: null
      }];
      this.submitAssignRequest(accounts);
    } else {
      const total = this.selectedAssignments.reduce((sum, a) => sum + (a.amount || 0), 0);
      if (total > this.selectedSale.pesosCop) {
        alert("El total asignado excede el monto de la venta.");
        return;
      }

      const accounts = this.selectedAssignments.map(a => ({
        amount: a.amount,
        nameAccount: a.account.name,
        accountCop: a.account.id
      }));

      this.submitAssignRequest(accounts);
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
    this.loadNoAsignadas();
  },
  error: (err) => {
    console.error('Error al asignar cuentas:', err);
    alert('Error al asignar las cuentas');
  }
});
}

loadNoAsignadas(): void {
  this.loading = true;
  this.noSalesMessage = '';

  const req$ = this.selectedBinanceAccount
    ? this.saleService.getTodayNoAsignadas(this.selectedBinanceAccount.name)
    : this.saleService.getTodayNoAsignadasAllAccounts();

  req$.subscribe({
    next: (sales) => {
      this.allAccountsp2p = sales ?? [];
      if (this.allAccountsp2p.length === 0) {
        this.noSalesMessage = 'No hay ventas P2P no asignadas hoy.';
      }
      this.loading = false;
    },
    error: (err) => {
      console.error('Error al cargar ventas P2P no asignadas:', err);
      this.noSalesMessage = 'Error al obtener ventas';
      this.loading = false;
    }
  });
}

}
