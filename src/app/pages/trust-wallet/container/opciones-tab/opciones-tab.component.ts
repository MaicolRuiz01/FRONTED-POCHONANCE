import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabViewModule } from 'primeng/tabview';
import { AsignacionesTabComponent } from '../../tabs/asignaciones-tab/asignaciones-tab.component';

@Component({
  selector: 'app-opciones-tab',
  standalone: true,
  imports: [
    CommonModule,
    TabViewModule,
    AsignacionesTabComponent
  ],
  templateUrl: './opciones-tab.component.html',
  styleUrl: './opciones-tab.component.css'
})
export class OpcionesTabComponent {
  tabIndex = 0;

}
