import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-nueva-vista',
  standalone: true,
  imports: [],
  templateUrl: './nueva-vista.component.html',
  styleUrl: './nueva-vista.component.css'
})
export class NuevaVistaComponent {
  constructor(private router: Router) {}

  volverAlInicio() {
    this.router.navigate(['/']);
  }

}
