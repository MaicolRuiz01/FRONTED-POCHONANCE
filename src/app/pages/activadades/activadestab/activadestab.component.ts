import { Component } from '@angular/core';
import { AnunciosComponent } from '../anuncios/anuncios.component';
import { CriptosComponent } from '../criptos/criptos.component';
import { CalculadoraComponent } from '../calculadora/calculadora.component';
import { SharedModule } from '../../../shared/shared.module';

@Component({
  selector: 'app-activadestab',
  standalone: true,
  imports: [SharedModule, AnunciosComponent, CriptosComponent, CalculadoraComponent],
  templateUrl: './activadestab.component.html',
  styleUrl: './activadestab.component.css'
})
export class ActivadestabComponent {

}
