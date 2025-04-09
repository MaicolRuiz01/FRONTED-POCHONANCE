import { Component } from '@angular/core';
import { SharedModule } from '../../../../shared/shared.module';
import { AsignacionComponent } from '../asignacion.component';
import { CuentasComponent } from '../cuentas/cuentas.component';

@Component({
  selector: 'app-tab-asignacion',
  standalone: true,
  imports: [SharedModule, AsignacionComponent, CuentasComponent],
  templateUrl: './tab-asignacion.component.html',
  styleUrl: './tab-asignacion.component.css'
})
export class TabAsignacionComponent {

}
