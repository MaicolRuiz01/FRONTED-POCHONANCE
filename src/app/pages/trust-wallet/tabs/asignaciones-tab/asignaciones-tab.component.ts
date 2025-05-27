import { Component} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AccordionModule } from 'primeng/accordion';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { MultiSelectModule } from 'primeng/multiselect';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { AsignacionesCompraTrustComponent } from './asignaciones-compra-trust/asignaciones-compra-trust.component';
import { AsignacionesVentaTrusComponent } from './asignaciones-venta-trus/asignaciones-venta-trus.component';

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
    AsignacionesCompraTrustComponent,
    AsignacionesVentaTrusComponent
  ],
  templateUrl: './asignaciones-tab.component.html',
  styleUrls: ['./asignaciones-tab.component.css']

})
export class AsignacionesTabComponent {

}
