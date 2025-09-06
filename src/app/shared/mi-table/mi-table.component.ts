import { Component, Input, Output, EventEmitter, ContentChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { TableModule } from 'primeng/table';

export interface TableColumn {
  campo: string;   // nombre de la propiedad en los datos
  columna: string;  // título de la columna
}

@Component({
  selector: 'app-mi-table',
  standalone: true,
  imports: [CommonModule, TableModule],
  templateUrl: './mi-table.component.html',
  styleUrls: ['./mi-table.component.css']
})
export class MiTableComponent {
  @Input() columns: TableColumn[] = [];
  @Input() data: any[] = [];

  // evento opcional si quieres capturar clics en filas
   @ContentChild('actionTemplate') actionTemplate!: TemplateRef<any>;


}