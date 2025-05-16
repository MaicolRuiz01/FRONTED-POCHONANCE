import { Component } from '@angular/core';
import { SharedModule } from '../../../shared/shared.module';

@Component({
  selector: 'app-calculadora',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './calculadora.component.html',
  styleUrl: './calculadora.component.css'
})
export class CalculadoraComponent {
  displayModal = false;

  banco: string = '';
  tipo: string = '';
  nombre: string = '';
  identificacion: string = '';
  cuenta: string = '';
  monto: number = 0;
  selectedTipoIdentificacion: string = 'CC';

  tipoIdentificacion = [
    { label: 'CC', value: 'CC' },
    { label: 'TI', value: 'TI' },
    { label: 'CE', value: 'CE' },
    { label: 'PA', value: 'PA' }
  ];

  cards = [
    {
      title: 'MILTON',
      documents: 3,
      value: '15\'000.000',
      editValue: 4200,
      currency: 'USDT',
      usdtValue: '3.500,75'
    },
    {
      title: 'OTRO',
      documents: 5,
      value: '20\'000.000',
      editValue: 5000,
      currency: 'USDT',
      usdtValue: '4.500,00'
    },
    {
      title: 'OTRO',
      documents: 5,
      value: '20\'000.000',
      editValue: 5000,
      currency: 'USDT',
      usdtValue: '4.500,00'
    }
  ];

  confirmar() {
    // Lógica para confirmar
    console.log('Datos confirmados');
    this.displayModal = false;
  }

}
