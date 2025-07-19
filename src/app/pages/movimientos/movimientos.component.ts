import { Component, OnInit  } from '@angular/core';
import { MovimientoService, MovimientoVistaDto } from '../../core/services/movimiento.service';
import { TabViewModule } from 'primeng/tabview';
import { TableModule } from 'primeng/table';
import { CommonModule } from '@angular/common';
import { CurrencyPipe } from '@angular/common';


@Component({
  selector: 'app-movimientos',
  standalone: true,
  imports: [
    TabViewModule,
    TableModule,
    CommonModule,
    CurrencyPipe
  ],
  templateUrl: './movimientos.component.html',
  styleUrl: './movimientos.component.css'
})
export class MovimientosComponent implements OnInit {
  loading: boolean = true;
  retiros: MovimientoVistaDto[] = [];
  depositos: MovimientoVistaDto[] = [];
  transferencias: MovimientoVistaDto[] = [];

  constructor(private movimientoService: MovimientoService) {}


  ngOnInit(): void {

    this.movimientoService.getRetiros().subscribe(data => this.retiros = data);
    this.movimientoService.getDepositos().subscribe(data => this.depositos = data);
    this.movimientoService.getTransferencias().subscribe(data => this.transferencias = data);

  }
  


  

}
