import { Component, TemplateRef, ViewChild} from '@angular/core';
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
import { PanelMenuModule } from 'primeng/panelmenu';
import { MenuItem } from 'primeng/api';


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
    AsignacionesVentap2pComponent,
    PanelMenuModule,
  ],
  templateUrl: './asignaciones-tab.component.html',
  styleUrls: ['./asignaciones-tab.component.css']
})
export class AsignacionesTabComponent{

 items: MenuItem[] = [];

  @ViewChild('compraTemplate') compraTemplate!: TemplateRef<any>;
  @ViewChild('ventasTemplate') ventasTemplate!: TemplateRef<any>;
  @ViewChild('p2pTemplate') p2pTemplate!: TemplateRef<any>;

  ngAfterViewInit() {
    this.items = [
      {
        label: 'ASIGNACIONES',
        items: [
          {
            label: 'Compras',
            icon: "pi pi-shopping-cart",
            items: [
              {
                label: 'Por Asignar',
                template: this.compraTemplate
              }
            ]
          },
          {
            label: 'Ventas',
            icon: "pi pi-chart-line",
            items: [
              {
                label: 'Por Asignar',
                template: this.ventasTemplate
              }
            ]
          },
          {
            label: 'P2P',
            icon: "pi pi-exchange",
            items: [
              {
                label: 'Por Asignar',
                template: this.p2pTemplate
              }
            ]
          }
        ]
      }
    ];
  }


}
