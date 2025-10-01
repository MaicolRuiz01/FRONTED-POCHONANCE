import { Component, OnInit } from '@angular/core';
import { Caja, CajaService } from '../../../../core/services/caja.service';
import { MovimientoService } from '../../../../core/services/movimiento.service';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { TabViewModule } from 'primeng/tabview';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card'; 
import { CommonModule } from '@angular/common';
import { InputNumberModule } from 'primeng/inputnumber';

@Component({
  selector: 'app-cajas-tab',
  standalone: true,
  imports: [FormsModule, ButtonModule, 
            InputTextModule, DialogModule, TabViewModule, 
            TableModule, CurrencyPipe, CardModule, InputNumberModule, CommonModule],
  templateUrl: './cajas.component.html',
  styleUrl: './cajas.component.css'
})



export class CajasComponent {

  cajas: Caja[] = [];
    displayCajaDialog: boolean = false;
    nuevaCaja: Partial<Caja> = { name: '', saldo: 0 };

    constructor(private movimientoService: MovimientoService,
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

}