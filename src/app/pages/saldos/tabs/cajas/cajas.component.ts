import { Component, OnInit } from '@angular/core';
import { Caja, CajaService } from '../../../../core/services/caja.service';
import { MovimientoService } from '../../../../core/services/movimiento.service';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe, CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { TabViewModule } from 'primeng/tabview';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { InputNumberModule } from 'primeng/inputnumber';

@Component({
  selector: 'app-cajas-tab',
  standalone: true,
  imports: [
    FormsModule, ButtonModule, InputTextModule, DialogModule, TabViewModule,
    TableModule, CurrencyPipe, CardModule, InputNumberModule, CommonModule
  ],
  templateUrl: './cajas.component.html',
  styleUrls: ['./cajas.component.css']   // 👈 corregido (plural)
})
export class CajasComponent implements OnInit {

  cajas: Caja[] = [];
  displayCajaDialog = false;
  nuevaCaja: Partial<Caja> = { name: '', saldo: 0 };

  // 🔹 NUEVO: estado para ver movimientos de una caja
  showMovsDialog = false;
  cajaSeleccionada: Caja | null = null;
  movimientosCaja: any[] = [];
  loadingMovs = false;

  constructor(
    private movimientoService: MovimientoService,
    private cajaService: CajaService
  ) {}

  ngOnInit(): void {
    this.loadCajas();
  }

  loadCajas() {
    this.cajaService.listar().subscribe(data => this.cajas = data);
  }

  get totalCajas(): number {
    return this.cajas.reduce((acc, caja) => acc + (caja.saldo ?? 0), 0);
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

  // 🔹 NUEVO: abrir modal y cargar movimientos por caja
  verMovimientos(caja: Caja) {
    if (!caja?.id) return;
    this.cajaSeleccionada = caja;
    this.movimientosCaja = [];
    this.loadingMovs = true;
    this.showMovsDialog = true;

    this.movimientoService.getMovimientosPorCaja(caja.id).subscribe({
      next: data => {
        // ordenar más reciente primero (por si el backend no lo hace)
        this.movimientosCaja = [...data].sort(
          (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
        );
      },
      error: e => console.error('Error al cargar movimientos de caja', e),
      complete: () => this.loadingMovs = false
    });
  }
}
