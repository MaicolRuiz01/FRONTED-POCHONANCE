import { Component, Input } from '@angular/core';
import { TableModule } from 'primeng/table';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-lista-pagos',
  standalone: true,
  imports: [TableModule, CommonModule ],
  templateUrl: './lista-pagos.component.html',
 
})
export class ListaPagosComponent {
  @Input() pagos: any[] = []; 
  pagosOrdenados: any[] = [];

  ngOnChanges() {
    this.pagosOrdenados = [...this.pagos].sort(
      (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
    );
  }

}
