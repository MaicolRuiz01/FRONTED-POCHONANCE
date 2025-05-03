import { Component } from '@angular/core';
import { CompletadaComponent } from '../../cripto/completada/completada.component';

@Component({
  selector: 'app-criptos',
  standalone: true,
  imports: [CompletadaComponent],
  templateUrl: './criptos.component.html',
  styleUrl: './criptos.component.css'
})
export class CriptosComponent {

}
