// src/app/components/traspasos-tab/traspasos-tab.component.ts
import { Component, OnInit } from '@angular/core';
import { TraspasosService, TransaccionesDTO } from '../../../../core/services/traspasos.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { CardModule } from 'primeng/card';



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
    CommonModule,
    ProgressSpinnerModule,
    CardModule
  ]
})
export class TraspasosTabComponent implements OnInit {
  traspasos: TransaccionesDTO[] = [];
  cargando: boolean = false;

  constructor(
    private traspasosService: TraspasosService
  ) {}

  ngOnInit(): void {
    this.cargarTraspasos();
  }

  cargarTraspasos(): void {
    this.cargando = true;
    this.traspasosService.getTransaccionesDeHoy().subscribe(
      (data) => {
        this.traspasos = data;
        this.cargando = false;
      },
      (error) => {
        console.error('Error al cargar los traspasos:', error);
        this.cargando = false;
      }
    );
  }

  
}
