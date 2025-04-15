import { Component } from '@angular/core';
import { SharedModule } from '../../../../shared/shared.module';

@Component({
  selector: 'app-cuentas',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './cuentas.component.html',
  styleUrl: './cuentas.component.css'
})
export class CuentasComponent {



  //modal agregar
  mostrarModal: boolean = false;

cuentas: string[] = ['Milton', 'Elva', 'Daniel'];
}
