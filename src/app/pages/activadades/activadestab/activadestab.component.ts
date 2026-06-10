import { Component } from '@angular/core';
import { AnunciosComponent } from '../anuncios/anuncios.component';
import { CalculadoraComponent } from '../calculadora/calculadora.component';
import { SharedModule } from '../../../shared/shared.module';
import { AjustesComponent } from '../Ajustes/ajustes.component';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-activadestab',
  standalone: true,
  imports: [SharedModule, AnunciosComponent, CalculadoraComponent, AjustesComponent],
  templateUrl: './activadestab.component.html',
  styleUrl: './activadestab.component.css'
})
export class ActivadestabComponent {

}
