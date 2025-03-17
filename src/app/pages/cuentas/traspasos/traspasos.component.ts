import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-traspasos',
  standalone: true,
  imports: [CommonModule, TableModule, InputTextModule, TagModule],
  templateUrl: './traspasos.component.html',
  styleUrls: ['./traspasos.component.css']
})
export class TraspasosComponent {
  customers = [
    {
      id: 1,
      name: 'Juan Pérez',
      country: { name: 'Argentina', code: 'ar' },
      representative: { name: 'Ana Gómez', image: 'avatar1.png' },
      status: 'active'
    },
    {
      id: 2,
      name: 'María Rodríguez',
      country: { name: 'México', code: 'mx' },
      representative: { name: 'Carlos Ruiz', image: 'avatar2.png' },
      status: 'inactive'
    }
  ];

  selectedCustomers: any;

  getSeverity(status: string) {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'danger';
      default:
        return 'info';
    }
  }
}
