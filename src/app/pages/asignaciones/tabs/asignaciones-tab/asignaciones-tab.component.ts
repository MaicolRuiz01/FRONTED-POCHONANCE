import { Component} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AccordionModule } from 'primeng/accordion';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { MultiSelectModule } from 'primeng/multiselect';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { AsignacionesVentasComponent } from './asignaciones-ventas/asignaciones-ventas.component';
import { AsignacionesComprasComponent } from './asignaciones-compras/asignaciones-compras.component';
import { AsignacionesVentap2pComponent } from './asignaciones-ventap2p/asignaciones-ventap2p.component';

@Component({
  selector: 'app-asignaciones-tab',
  standalone: true,
  imports: [
    CommonModule,
    AccordionModule,
    TableModule,
    DialogModule,
    MultiSelectModule,
    FormsModule,
    ButtonModule,
    AsignacionesComprasComponent,
    AsignacionesVentasComponent,
    AsignacionesVentap2pComponent
  ],
  templateUrl: './asignaciones-tab.component.html',
  styleUrls: ['./asignaciones-tab.component.css']
})
export class AsignacionesTabComponent{
}
