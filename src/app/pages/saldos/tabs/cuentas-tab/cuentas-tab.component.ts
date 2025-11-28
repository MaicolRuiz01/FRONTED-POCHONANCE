import { Component, OnInit } from '@angular/core';
import { AccountCopService, AccountCop, AccountCopCreate } from '../../../../core/services/account-cop.service';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { CardModule } from 'primeng/card';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MovimientoService } from '../../../../core/services/movimiento.service';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { ClienteService, Cliente } from '../../../../core/services/cliente.service';
import { CajaService, Caja } from '../../../../core/services/caja.service';
import { AjusteSaldoDialogComponent } from '../../../../shared/ajustes-saldo/ajuste-saldo-dialog.component';

import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';


@Component({
  selector: 'app-cuentas-tab',
  standalone: true,
  imports: [DialogModule,
    ButtonModule,
    FormsModule,
    TableModule,
    InputTextModule,
    CardModule,
    CommonModule,
    DropdownModule,
    InputNumberModule,
    AjusteSaldoDialogComponent
  ],
  templateUrl: './cuentas-tab.component.html',
  styleUrls: ['./cuentas-tab.component.css']
})
export class CuentasTabComponent implements OnInit {
  cuentas: AccountCop[] = [];
  newAccount: AccountCopCreate = { name: '', balance: 0 };
  displayDialog: boolean = false;
  clientes: Cliente[] = [];
  cajas: Caja[] = [];
  selectedCajaId?: number;


  selectedCuentaOrigenId?: number;
  selectedCuentaDestinoId?: number;
  montoMovimiento?: number;
  displayDialogRetiro: boolean = false;
  displayDialogDeposito: boolean = false;
  displayDialogTransferencia: boolean = false;
  selectedClienteId?: number;

  displayDialogPago: boolean = false;  // <-- faltaba declarar esto
  cuentaPagoId?: number;               // <-- también esta
  montoPago?: number;
  showAjusteCuenta = false;
  cuentaAjuste: AccountCop | null = null;
  displayDialogExcel: boolean = false;

  formsValues = {
    cuentaId: null
  };


  constructor(private accountService: AccountCopService,
    private movimientoService: MovimientoService,
    private clienteService: ClienteService,
    private cajaService: CajaService,
    private router: Router) { }

  ngOnInit(): void {
    this.loadCuentas();
    this.loadClientes();
    this.cajaService.listar().subscribe({
      next: data => this.cajas = data,
      error: () => alert('Error al cargar cajas')
    });
  }

  abrirAjusteCuenta(cuenta: AccountCop) {
    this.cuentaAjuste = cuenta;
    this.showAjusteCuenta = true;
  }

  onAjusteCuentaRealizado() {
    this.loadCuentas();
  }

  goToVentas(accountId: number) {
    this.router.navigate(['/cuentas', accountId, 'ventas']);
  }


  get totalCuentas(): number {
    return this.cuentas.reduce((acc, cuenta) => acc + (cuenta.balance ?? 0), 0);
  }

  loadCuentas() {
    this.accountService.getAll().subscribe({
      next: (cuentas: AccountCop[]) => {
        console.log('Cuentas recibidas:', cuentas);
        this.cuentas = cuentas;
      },
      error: (err: any) => {
        console.error('Error al cargar cuentas:', err.message, err);
      }
    });

  }

  loadClientes() {
    this.clienteService.listar().subscribe({
      next: data => this.clientes = data,
      error: () => alert('Error al cargar clientes')
    });
  }

  createAccount() {
    console.log('Creating Account:', this.newAccount);
    this.accountService.create(this.newAccount).subscribe(account => {
      this.cuentas.push(account);
      this.displayDialog = false;
      this.newAccount = { name: '', balance: 0 }; // Reseteo sin ID
    }, error => {
      console.error('Error creating account', error);
    });
  }

  showCreateDialog() {
    this.displayDialog = true;
  }

  abrirDialogPago() {
    this.displayDialogPago = true;
    this.selectedClienteId = undefined;
    this.cuentaPagoId = undefined;
    this.montoPago = undefined;
  }

  abrirDialogRetiro() {
    this.displayDialogRetiro = true;
    this.selectedCuentaOrigenId = undefined;
    this.montoMovimiento = undefined;
    this.selectedCajaId = undefined;
  }

  abrirDialogDeposito() {
    this.displayDialogDeposito = true;
    this.selectedCuentaDestinoId = undefined;
    this.montoMovimiento = undefined;
    this.selectedCajaId = undefined;

  }

  abrirDialogTransferencia() {
    this.displayDialogTransferencia = true;
    this.selectedCuentaOrigenId = undefined;
    this.selectedCuentaDestinoId = undefined;
    this.montoMovimiento = undefined;
  }

  abrirDialogexcel() {
   this.displayDialogExcel = true;
  }
  cerrarDialogexcel() {
    this.displayDialogExcel = false;
  }

  registrarRetiro() {
    if (!this.selectedCuentaOrigenId || !this.selectedCajaId || !this.montoMovimiento) return;

    const url = `${this.movimientoService['apiUrl']}/retiro?cuentaId=${this.selectedCuentaOrigenId}&cajaId=${this.selectedCajaId}&monto=${this.montoMovimiento}`;
    this.movimientoService['http'].post(url, {}).subscribe({
      next: () => {
        this.displayDialogRetiro = false;
        this.loadCuentas();
      },
      error: () => alert('Error al registrar retiro')
    });
  }

  registrarDeposito() {
    if (!this.selectedCuentaDestinoId || !this.selectedCajaId || !this.montoMovimiento) return;

    const url = `${this.movimientoService['apiUrl']}/deposito?cuentaId=${this.selectedCuentaDestinoId}&cajaId=${this.selectedCajaId}&monto=${this.montoMovimiento}`;
    this.movimientoService['http'].post(url, {}).subscribe({
      next: () => {
        this.displayDialogDeposito = false;
        this.loadCuentas();
      },
      error: () => alert('Error al registrar depósito')
    });
  }


  registrarTransferencia() {
    if (!this.selectedCuentaOrigenId || !this.selectedCuentaDestinoId || !this.montoMovimiento) return;

    this.movimientoService.registrarTransferencia(
      this.selectedCuentaOrigenId,
      this.selectedCuentaDestinoId,
      this.montoMovimiento
    ).subscribe(() => {
      this.displayDialogTransferencia = false;
      this.loadCuentas();
    });
  }

  registrarPagoCliente() {
    if (!this.selectedClienteId || !this.cuentaPagoId || !this.montoPago) return;
    const url = `${this.movimientoService['apiUrl']}/pago?cuentaId=${this.cuentaPagoId}&clienteId=${this.selectedClienteId}&monto=${this.montoPago}`;
    this.movimientoService['http'].post(url, {}).subscribe({
      next: () => {
        this.displayDialogPago = false;
        this.loadCuentas();
        this.loadClientes();
      },
      error: () => alert('Error al registrar pago')
    });
  }


  exportarExcelcuenta(id: number | null): void {

    if (!id) return;

    const cuenta = this.cuentas.find(c => c.id === id);
    if (!cuenta) {
      console.error("Cuenta no encontrada");
      return;
    }

    const nombreCuenta = cuenta.name.trim().toLowerCase();

    // 🔹 Movimientos filtrados de esta cuenta (del proveedor)
    this.movimientoService.getAllMovimientos().subscribe({
      next: (movimientos: any[]) => {


        const movimientosFiltrados = movimientos.filter(mov => {
          // extraer posible nombre: puede venir como string, objeto {name:...} o null/undefined
          const raw = mov.pagoProveedor;

          let proveedorName = '';
          if (raw == null) {
            proveedorName = '';
          } else if (typeof raw === 'string') {
            proveedorName = raw;
          } else if (typeof raw === 'object' && raw.name) {
            proveedorName = raw.name;
          } else {
            // si viene solo el id u otro tipo, forzamos a string
            proveedorName = String(raw);
          }

          return proveedorName.trim().toLowerCase().includes(nombreCuenta);
        });

        // 🔹 Cargar compras por proveedor (si necesitas otra llamada, hazla aquí y combínala,
        // por ahora solo exportamos los movimientos filtrados)

        console.log("Movimientos filtrados:", movimientosFiltrados);

        // --------------------------------
        // 🟦 CREAR EXCEL CON MULTIHOJA
        // --------------------------------
        const workbook = XLSX.utils.book_new();

        // Hoja 1 ─ Movimientos
        const wsMov = XLSX.utils.json_to_sheet(movimientosFiltrados);
        XLSX.utils.book_append_sheet(workbook, wsMov, 'Movimientos');

        // Hoja 2 ─ Compras (agregar si implementas la carga de compras)

        // Exportar archivo
        const excelBuffer = XLSX.write(workbook, {
          bookType: 'xlsx',
          type: 'array'
        });

        const blob = new Blob([excelBuffer], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });

        saveAs(blob, `Reporte_Cuenta_${cuenta.name}.xlsx`);

        this.displayDialogExcel = false; // nombre real de tu modal
      },
      error: (err: any) => console.error("Error al cargar movimientos", err)
    });
  }
}