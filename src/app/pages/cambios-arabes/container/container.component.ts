import { Component } from '@angular/core';
import { SharedModule } from '../../../shared/shared.module';
import { ComprasVesComponent } from '../tabs/compras-ves/compras-ves.component';
import { VentasVesComponent } from '../tabs/ventas-ves/ventas-ves.component';

@Component({
  selector: 'app-container',
  standalone: true,
  imports: [SharedModule, ComprasVesComponent, VentasVesComponent],
  templateUrl: './container.component.html',
  styleUrl: './container.component.css'
})
export class ContainerComponent {
  selectedIndex = 0;
}
