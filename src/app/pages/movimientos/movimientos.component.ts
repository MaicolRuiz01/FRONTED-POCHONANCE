import { Component, OnInit  } from '@angular/core';
import { MovimientoService, MovimientoVistaDto } from '../../core/services/movimiento.service';
import { TabViewModule } from 'primeng/tabview';
import { TableModule } from 'primeng/table';
import { CommonModule } from '@angular/common';
import { CurrencyPipe } from '@angular/common';
import { Caja, CajaService } from '../../core/services/caja.service';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { TraspasosService,TransaccionesDTO } from '../../core/services/traspasos.service';


@Component({
  selector: 'app-movimientos',
  standalone: true,
  imports: [
    TabViewModule,
    TableModule,
    CommonModule,
    CurrencyPipe,
    DialogModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
  ],
  templateUrl: './movimientos.component.html',
  styleUrl: './movimientos.component.css'
})
export class MovimientosComponent implements OnInit {
  loading: boolean = true;
  retiros: MovimientoVistaDto[] = [];
  depositos: MovimientoVistaDto[] = [];
  transferencias: MovimientoVistaDto[] = [];
  traspasos: TransaccionesDTO[] = [];
  cargando: boolean = false;

  cajas: Caja[] = [];
  displayCajaDialog: boolean = false;
  nuevaCaja: Partial<Caja> = { name: '', saldo: 0 };

  constructor(private movimientoService: MovimientoService,
    private cajaService: CajaService,
    private traspasosService: TraspasosService
  ) {}


  ngOnInit(): void {

    this.movimientoService.getRetiros().subscribe(data => this.retiros = data);
    this.movimientoService.getDepositos().subscribe(data => this.depositos = data);
    this.movimientoService.getTransferencias().subscribe(data => this.transferencias = data);
    this.loadCajas();
    this.traspasos = [];
    this.cargando = false;
     this.cargarTraspasos();
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

   cargarTraspasos(): void {
    this.cargando = true;
    this.traspasosService.getTransaccionesDeHoy().subscribe(
      (data) => {
        this.traspasos = data;
        this.cargando = false;
      },
      (error) => {
        console.error('Error al cargar los traspasos:', error);
        this.cargando = false;
      }
    );
  }

  mostrarDialogo: boolean = false;
movimientoEditando: any = {}; // puede ser MovimientoVistaDto o TransaccionesDTO
tipoEditando: string = '';

abrirDialogo(movimiento: any, tipo: string) {
  this.movimientoEditando = { ...movimiento, tipo }; // clonar y guardar tipo
  this.tipoEditando = tipo;
  this.mostrarDialogo = true;
}

cerrarDialogo() {
  this.mostrarDialogo = false;
  this.movimientoEditando = {};
  this.tipoEditando = '';
}

guardarEdicion() {
  if (!this.movimientoEditando.id) return;

  this.movimientoService.actualizarMovimiento(this.movimientoEditando.id, this.movimientoEditando).subscribe({
    next: (movimientoActualizado) => {
      const lista = this.obtenerListaPorTipo(this.tipoEditando);
      const index = lista.findIndex((m: any) => m.id === movimientoActualizado.id);
      if (index > -1) lista[index] = movimientoActualizado;

      this.cerrarDialogo();
    },
    error: () => alert('Error al actualizar el movimiento')
  });
}

private obtenerListaPorTipo(tipo: string) {
  switch (tipo) {
    case 'RETIRO': return this.retiros;
    case 'DEPOSITO': return this.depositos;
    case 'TRANSFERENCIA': return this.transferencias;
    case 'TRASPASO': return this.traspasos;
    default: return [];
  }
}
}
