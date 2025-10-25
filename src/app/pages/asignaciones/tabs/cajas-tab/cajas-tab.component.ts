import { Component, OnInit  } from '@angular/core';
import { MovimientoService, MovimientoVistaDto } from '../../../../core/services/movimiento.service';
import { TabViewModule } from 'primeng/tabview';
import { TableModule } from 'primeng/table';
import { CommonModule } from '@angular/common';
import { CurrencyPipe } from '@angular/common';
import { Caja, CajaService } from '../../../../core/services/caja.service';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';


@Component({
  selector: 'app-cajas-tab',
  standalone: true,
  imports: [
    TabViewModule,
    TableModule,
    CommonModule,
    CurrencyPipe,
    DialogModule,
    FormsModule,
    ButtonModule,
    InputTextModule
  ],
  templateUrl: './cajas-tab.component.html',
  styleUrl: './cajas-tab.component.css'
})
export class MovimientosComponent implements OnInit {
  loading: boolean = true;
  loadingCajas = false;
  retiros: MovimientoVistaDto[] = [];
  depositos: MovimientoVistaDto[] = [];
  transferencias: MovimientoVistaDto[] = [];

  cajas: Caja[] = [];
  displayCajaDialog: boolean = false;
  nuevaCaja: Partial<Caja> = { name: '', saldo: 0 };

  showMovsDialog = false;
  cajaSeleccionada: Caja | null = null;
  movimientosCaja: any[] = [];
  loadingMovs = false;

  constructor(private movimientoService: MovimientoService,
    private cajaService: CajaService
  ) {}


  ngOnInit(): void {

    this.movimientoService.getRetiros().subscribe(data => this.retiros = data);
    this.movimientoService.getDepositos().subscribe(data => this.depositos = data);
    this.movimientoService.getTransferencias().subscribe(data => this.transferencias = data);
    this.loadCajas();
  }
  abrirCrearCaja(): void {
    this.nuevaCaja = { name: '', saldo: 0 };
    this.displayCajaDialog = true;
  }
  
  loadCajas() {
    this.cajaService.listar().subscribe(data => this.cajas = data);
  }

  guardarCaja() {
    if (!this.nuevaCaja.name || this.nuevaCaja.saldo === undefined) return;

    this.cajaService.crear(this.nuevaCaja).subscribe({
      next: caja => {
        this.cajas.push(caja);
        this.displayCajaDialog = false;
        this.nuevaCaja = { name: '', saldo: 0 };
      },
      error: () => alert('Error al guardar caja')
    });
  }
// Al hacer clic en una caja, abrimos modal y cargamos sus movimientos
  verMovimientos(caja: Caja): void {
    this.cajaSeleccionada = caja;
    this.movimientosCaja = [];
    this.loadingMovs = true;
    this.showMovsDialog = true;

    this.movimientoService.getMovimientosPorCaja(caja.id!).subscribe({
      next: (data) => {
        // ordenar por fecha desc si hace falta
        this.movimientosCaja = [...data].sort(
          (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
        );
      },
      error: (e) => console.error('Error al cargar movimientos de caja', e),
      complete: () => this.loadingMovs = false
    });
  }
  

  

}
