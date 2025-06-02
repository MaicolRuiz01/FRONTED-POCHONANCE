// src/app/components/traspasos-tab/traspasos-tab.component.ts
import { Component, OnInit } from '@angular/core';
import { TraspasosService, TransaccionesDTO } from '../../../../core/services/traspasos.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';



@Component({
  selector: 'app-traspasos-tab',
  standalone: true,
  templateUrl: './traspasos-tab.component.html',
  styleUrls: ['./traspasos-tab.component.css'],
  providers: [ConfirmationService, MessageService],
  imports:[
    ToastModule,
    ConfirmDialogModule,
    TableModule,
    ButtonModule,
    CommonModule
  ]
})
export class TraspasosTabComponent implements OnInit {
  traspasos: TransaccionesDTO[] = [];

  constructor(
    private traspasosService: TraspasosService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.cargarTraspasos();
  }

  cargarTraspasos(): void {
    this.traspasosService.obtenerTodosLosTraspasos().subscribe(
      (data) => {
        this.traspasos = data;
      },
      (error) => {
        console.error('Error al cargar los traspasos:', error);
      }
    );
  }

  confirmarTraspaso(traspaso: TransaccionesDTO): void {
    this.confirmationService.confirm({
      message: '¿Estás seguro de confirmar este traspaso?',
      accept: () => {
        this.traspasosService.guardarTransaccion(traspaso).subscribe(
          () => {
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Traspaso confirmado' });
            this.cargarTraspasos();
          },
          (error) => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo confirmar el traspaso' });
            console.error('Error al guardar el traspaso:', error);
          }
        );
      },
    });
  }
}
