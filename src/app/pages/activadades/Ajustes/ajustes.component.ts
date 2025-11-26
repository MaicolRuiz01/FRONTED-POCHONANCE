import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ButtonModule } from "primeng/button";
import { CardModule } from "primeng/card";
import { DialogModule } from "primeng/dialog";
import { DropdownModule } from "primeng/dropdown";
import { InputNumberModule } from "primeng/inputnumber";
import { InputTextModule } from "primeng/inputtext";
import { SelectButtonModule } from "primeng/selectbutton";
import { TableModule } from "primeng/table";
import { TabViewModule } from "primeng/tabview";
import { AjustesService, AjustesDto} from "../../../core/services/ajustes.service";
import { MovimientoDto, MovimientoService } from "../../../core/services/movimiento.service";
import { ClienteService } from "../../../core/services/cliente.service";
import { SupplierService } from "../../../core/services/supplier.service";





@Component({
  selector: 'app-ajustes',
  standalone: true,
  imports: [
    CommonModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    FormsModule,
    InputNumberModule,
    CardModule,
    DropdownModule,
    TabViewModule,
    TableModule,
    SelectButtonModule
  ],
  templateUrl: './ajustes.component.html',
  styleUrls: ['./ajustes.component.css'],

})

export class AjustesComponent implements OnInit{


    ajustes:  AjustesDto[] = [];
    ajusteSeleccionado: AjustesDto | null = null;
    crearDialogVisible: boolean = false;

   formValues = {
  usuariocl_id: null,
  usuariopr_id: null,
  movimientoid: null,
  contenido: '',
  monto: null
};

movimientos: MovimientoDto[] = [];
clientes: any[] = [];
proveedores: any[] = [];
    
    constructor(
      private ajustesService: AjustesService,
      private movimientoService: MovimientoService,
      private clienteService: ClienteService,
      private proveedorService: SupplierService
    ) {}

    ngOnInit(): void {
        this.cargarAjustes();
        this.cargarMovimientos();
        this.cargarClientes();
        this.cargarProveedores();
    }

    cargarClientes() {
        
  this.clienteService.listar().subscribe(data => this.clientes = data);
  console.log(this.clientes);
}

cargarProveedores() {
  this.proveedorService.getAllSuppliers().subscribe(data => this.proveedores = data);
}

cargarMovimientos() {
  this.movimientoService.getAllMovimientos().subscribe((data: MovimientoDto[]) => this.movimientos = data);
}

abrirCrearDialog(): void {
    this.crearDialogVisible = true;
    }

    cerrarCrearDialog(): void {
        this.crearDialogVisible = false;
    }

cargarAjustes() {
    this.ajustesService.listar().subscribe({
      next: (data: AjustesDto[]) => this.ajustes = data,
      error: () => alert('Error al cargar los clientes')
    });
  }


crearAjuste(data: any): void  {


  const payload = {
    contenido: this.formValues.contenido,
    monto: this.formValues.monto || undefined,
    movimiento: { id: this.formValues.movimientoid },
    usuarioCL: this.formValues.usuariocl_id ? { id: this.formValues.usuariocl_id } : null,
    usuarioPR: this.formValues.usuariopr_id ? { id: this.formValues.usuariopr_id } : null
  };


    this.ajustesService.crear(payload).subscribe({ 
        next: () => {
            this.cargarAjustes();
            console.log('Clientes recibidos:', data);
            this.ajusteSeleccionado = null;
            this.cerrarCrearDialog();
        },
        error: () => alert('Error al crear el ajuste')
    });
}

buscarAjustePorcliente(id: number): void {

if (this.ajusteSeleccionado?.usuariocl_id) {

this.ajustesService.obtenerporcliente(id).subscribe({
    next: data => this.ajustes = data,
    error: () => alert('Error al buscar ajustes por cliente')
});
}

}

buscarAjustePorProveedor(id: number): void {

if (this.ajusteSeleccionado?.usuariopr_id) {

this.ajustesService.obtenerporproveedor(id).subscribe({
    next: data => this.ajustes = data,
    error: () => alert('Error al buscar ajustes por proveedor')
});
}

}


}