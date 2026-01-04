import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SharedModule } from '../../../../shared/shared.module';
import { VesConfigService, VesConfigDto } from '../../../../core/services/ves-config.service';
import { CardModule } from 'primeng/card';
import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';
import { BalanceGeneralService, BalanceGeneral } from '../../../../core/services/balance-general.service';


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
  saldoVesPesos: number | null = null; 
  // ruta a la plantilla base
  private baseImagePath = 'assets/layout/images/plantillaTasa.jpg';

  constructor(
    private fb: FormBuilder,
    private api: VesConfigService,
    private balanceService: BalanceGeneralService
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
    this.loadSaldoVes();
  }

  loadConfig(): void {
    this.api.getConfig().subscribe(cfg => {
      if (cfg) {
        this.form.patchValue(cfg);
      }
      this.loading = false;
    });
  }

  private loadSaldoVes(): void {
    this.balanceService.listar().subscribe({
      next: (balances) => {
        if (balances && balances.length > 0) {
          // el endpoint /hoy ya devuelve solo uno, pero por si acaso ordenamos
          const ordenados = [...balances].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          );
          const hoy = ordenados[0];
          this.saldoVesPesos = hoy.saldosVES ?? 0;
        } else {
          this.saldoVesPesos = 0;
        }
      },
      error: (err) => {
        console.error('Error cargando saldo VES', err);
        this.saldoVesPesos = null;
      }
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

    // Configuración general de texto
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';

    // === COORDENADAS BASE (AJUSTA UN POCO SI HACE FALTA) ===
    const xPesos = canvas.width * 0.27; // izquierda
    const xTasa  = canvas.width * 0.50; // centro
    const xVes   = canvas.width * 0.77; // derecha

    const y1 = canvas.height * 0.43;
    const y2 = canvas.height * 0.52;
    const y3 = canvas.height * 0.61;

    // Tamaño de las cajas (fondos negros)
    const boxWidth  = canvas.width * 0.20;
    const boxHeight = canvas.height * 0.05;

    // Helper para dibujar caja negra semi-transparente centrada
    const drawBox = (cx: number, cy: number) => {
      ctx.fillStyle = 'rgba(0,0,0,0.65)';
      ctx.fillRect(
        cx - boxWidth / 2,
        cy - boxHeight / 2,
        boxWidth,
        boxHeight
      );
    };

    // =======================
    //  FECHA ARRIBA DERECHA
    // =======================
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

    // Volvemos a center para el resto
    ctx.textAlign = 'center';

    // =======================
    //  CABECERAS: PESOS / TASA / BS
    // =======================
    const headerY = canvas.height * 0.36;

    // Cajas de cabecera
    drawBox(xPesos, headerY);
    drawBox(xTasa,  headerY);
    drawBox(xVes,   headerY);

    ctx.font = `${canvas.height * 0.03}px 'Arial'`;
    ctx.fillStyle = '#FFFFFF';

    ctx.fillText('PESOS', xPesos, headerY);
    ctx.fillText('TASA',  xTasa,  headerY);
    ctx.fillText('BS',    xVes,   headerY);

    // =======================
    //  VALORES (3 FILAS)
    // =======================
    const v = this.form.value;

    // Textos formateados
    const pesos1Txt = `$${this.formatNumber(this.pesos1)}`;
    const pesos2Txt = `$${this.formatNumber(this.pesos2)}`;
    const pesos3Txt = `$${this.formatNumber(this.pesos3)}`;

    const tasa1Txt = this.formatNumber(v.tasa1);
    const tasa2Txt = this.formatNumber(v.tasa2);
    const tasa3Txt = this.formatNumber(v.tasa3);

    const ves1Txt = this.formatNumber(v.ves1);
    const ves2Txt = this.formatNumber(v.ves2);
    const ves3Txt = this.formatNumber(v.ves3);

    // --- FILA 1: cajas ---
    drawBox(xPesos, y1);
    drawBox(xTasa,  y1);
    drawBox(xVes,   y1);

    // --- FILA 2: cajas ---
    drawBox(xPesos, y2);
    drawBox(xTasa,  y2);
    drawBox(xVes,   y2);

    // --- FILA 3: cajas ---
    drawBox(xPesos, y3);
    drawBox(xTasa,  y3);
    drawBox(xVes,   y3);

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

    // =======================
    // DESCARGAR PNG
    // =======================
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
