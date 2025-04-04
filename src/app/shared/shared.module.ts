// shared.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// PrimeNG modules
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { RadioButtonModule } from 'primeng/radiobutton';
import { RippleModule } from 'primeng/ripple';
import { TableModule } from 'primeng/table';
import { FileUploadModule } from 'primeng/fileupload';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { RatingModule } from 'primeng/rating';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { DialogModule } from 'primeng/dialog';
import { MiCardComponent } from './mi-card/mi-card.component';
import { CalendarModule } from 'primeng/calendar';
import { HttpClientModule } from '@angular/common/http';
import { Accordion, AccordionModule } from 'primeng/accordion';

@NgModule({
  declarations: [  // ✅ Agregar aquí
    MiCardComponent,

  ],
  imports: [

    CommonModule,
    FormsModule,
    ButtonModule,
    DropdownModule,
    InputNumberModule,
    InputTextModule,
    RadioButtonModule,
    RippleModule,
    TableModule,
    FileUploadModule,
    ToastModule,
    ToolbarModule,
    RatingModule,
    InputTextareaModule,
    DialogModule,
    ReactiveFormsModule,
    CalendarModule,
    HttpClientModule,
    AccordionModule


  ],
  exports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    DropdownModule,
    InputNumberModule,
    InputTextModule,
    RadioButtonModule,
    RippleModule,
    TableModule,
    FileUploadModule,
    ToastModule,
    ToolbarModule,
    RatingModule,
    InputTextareaModule,
    DialogModule,
    ReactiveFormsModule,
    CalendarModule,
    MiCardComponent,
    AccordionModule


  ]
})
export class SharedModule {}
