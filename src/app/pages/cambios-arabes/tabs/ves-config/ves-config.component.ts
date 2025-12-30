import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SharedModule } from '../../../../shared/shared.module';
import { VesConfigService, VesConfigDto } from '../../../../core/services/ves-config.service';
import { CardModule } from 'primeng/card';
import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-ves-config',
  standalone: true,
  imports: [
    SharedModule,
    ReactiveFormsModule,
    CardModule,
    InputNumberModule,
    ButtonModule
  ],
  templateUrl: './ves-config.component.html',
  styleUrl: './ves-config.component.css'
})
export class VesConfigComponent implements OnInit {

  @ViewChild('rateCanvas', { static: false })
  canvasRef!: ElementRef<HTMLCanvasElement>;

  form!: FormGroup;
  loading = true;

  // ruta a la plantilla base
  private baseImagePath = 'assets/layout/images/plantillaTasa.jpg';

  constructor(
    private fb: FormBuilder,
    private api: VesConfigService
  ) {}

  ngOnInit(): void {

    this.form = this.fb.group({
      ves1: [5000, [Validators.required, Validators.min(1)]],
      tasa1: [0, [Validators.required, Validators.min(0.0001)]],
      ves2: [1000, [Validators.required, Validators.min(1)]],
      tasa2: [0, [Validators.required, Validators.min(0.0001)]],
      ves3: [100, [Validators.required, Validators.min(1)]],
      tasa3: [0, [Validators.required, Validators.min(0.0001)]],
    });

    this.loadConfig();
  }

  loadConfig(): void {
    this.api.getConfig().subscribe(cfg => {
      if (cfg) {
        this.form.patchValue(cfg);
      }
      this.loading = false;
    });
  }

  // PREVIEW PESOS
  get pesos1(): number {
    const v = this.form.value;
    return (v.ves1 || 0) * (v.tasa1 || 0);
  }

  get pesos2(): number {
    const v = this.form.value;
    return (v.ves2 || 0) * (v.tasa2 || 0);
  }

  get pesos3(): number {
    const v = this.form.value;
    return (v.ves3 || 0) * (v.tasa3 || 0);
  }

  save(): void {
    if (this.form.invalid) return;

    const dto = this.form.value as VesConfigDto;

    this.api.updateConfig(dto).subscribe(() => {
      alert('Configuración guardada');
    });
  }

  // =======================
  // GENERAR IMAGEN
  // =======================
  generateImage(): void {
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      console.error('No se pudo obtener el contexto del canvas');
      return;
    }

    const img = new Image();
    img.src = this.baseImagePath;
    img.onload = () => {
      // Ajustamos canvas al tamaño de la plantilla
      canvas.width = img.width;
      canvas.height = img.height;

      // 1) Fondo
      ctx.drawImage(img, 0, 0);

      // Configuración de texto
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';

      // === COORDENADAS (AJÚSTALAS A OJO HASTA QUE QUEDE PERFECTO) ===
      // Supongamos imagen vertical tipo story (ej: 1080x1920)
      // X aproximados para columnas (PESOS, TASA, VES)
      const xPesos = canvas.width * 0.27; // izquierda
      const xTasa  = canvas.width * 0.50; // centro
      const xVes   = canvas.width * 0.77; // derecha

      // Y para filas
      const y1 = canvas.height * 0.43;
      const y2 = canvas.height * 0.52;
      const y3 = canvas.height * 0.61;

      // Fecha arriba derecha, estilo "15 AGOSTO"
      const now = new Date();
      const meses = [
        'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
        'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
      ];
      const fechaTxt = `${now.getDate()} ${meses[now.getMonth()]}`;

      ctx.font = `${canvas.height * 0.035}px 'Arial'`;
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'right';
      ctx.fillText(fechaTxt, canvas.width * 0.92, canvas.height * 0.19);

      // Volvemos a center para los valores
      ctx.textAlign = 'center';

      // Valores formateados
      const pesos1Txt = `$${this.formatNumber(this.pesos1)}`;
      const pesos2Txt = `$${this.formatNumber(this.pesos2)}`;
      const pesos3Txt = `$${this.formatNumber(this.pesos3)}`;

      const v = this.form.value;

      const tasa1Txt = this.formatNumber(v.tasa1);
      const tasa2Txt = this.formatNumber(v.tasa2);
      const tasa3Txt = this.formatNumber(v.tasa3);

      const ves1Txt = this.formatNumber(v.ves1);
      const ves2Txt = this.formatNumber(v.ves2);
      const ves3Txt = this.formatNumber(v.ves3);

      // PESOS – blanco
      ctx.font = `${canvas.height * 0.035}px 'Arial'`;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(pesos1Txt, xPesos, y1);
      ctx.fillText(pesos2Txt, xPesos, y2);
      ctx.fillText(pesos3Txt, xPesos, y3);

      // TASA – amarillo
      ctx.font = `${canvas.height * 0.038}px 'Arial'`;
      ctx.fillStyle = '#FFD600';
      ctx.fillText(tasa1Txt, xTasa, y1);
      ctx.fillText(tasa2Txt, xTasa, y2);
      ctx.fillText(tasa3Txt, xTasa, y3);

      // VES – blanco
      ctx.font = `${canvas.height * 0.035}px 'Arial'`;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(ves1Txt, xVes, y1);
      ctx.fillText(ves2Txt, xVes, y2);
      ctx.fillText(ves3Txt, xVes, y3);

      // Descargar
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `tasas_${fechaTxt.replace(' ', '_')}.png`;
      link.click();
    };

    img.onerror = (err) => {
      console.error('Error cargando la imagen base', err);
    };
  }

  // formatear con puntos de miles
  private formatNumber(value: number): string {
    if (value == null) return '0';
    return Math.round(value).toLocaleString('es-CO');
  }
}
