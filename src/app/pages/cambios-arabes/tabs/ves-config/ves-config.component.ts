import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SharedModule } from '../../../../shared/shared.module';
import { VesConfigService, VesConfigDto } from '../../../../core/services/ves-config.service';
import { CardModule } from 'primeng/card';
import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';
import { BalanceGeneralService } from '../../../../core/services/balance-general.service';
import { InputSwitchModule } from 'primeng/inputswitch';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-ves-config',
  standalone: true,
  imports: [
    SharedModule,
    ReactiveFormsModule,
    FormsModule,
    CardModule,
    InputNumberModule,
    ButtonModule,
    InputSwitchModule
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

  // 👇 nuevo
  tasaUnica = false;

  // plantillas
  private baseImagePathMulti = 'assets/layout/images/plantillaTasa.jpg';
  private baseImagePathUnica = 'assets/layout/images/ves-tasa-unica.jpg';

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

  onToggleTasaUnica(): void {
    if (this.tasaUnica) {
      // al activar: limpiamos tramos 2 y 3 (y evitamos validación)
      this.form.patchValue({ ves2: null, tasa2: null, ves3: null, tasa3: null });

      this.form.get('ves2')?.clearValidators();
      this.form.get('tasa2')?.clearValidators();
      this.form.get('ves3')?.clearValidators();
      this.form.get('tasa3')?.clearValidators();
    } else {
      // al desactivar: reponemos validaciones y defaults si están null
      this.form.get('ves2')?.setValidators([Validators.required, Validators.min(1)]);
      this.form.get('tasa2')?.setValidators([Validators.required, Validators.min(0.0001)]);
      this.form.get('ves3')?.setValidators([Validators.required, Validators.min(1)]);
      this.form.get('tasa3')?.setValidators([Validators.required, Validators.min(0.0001)]);

      const v = this.form.value;
      this.form.patchValue({
        ves2: v.ves2 ?? 1000,
        tasa2: v.tasa2 ?? 0,
        ves3: v.ves3 ?? 100,
        tasa3: v.tasa3 ?? 0,
      });
    }

    this.form.get('ves2')?.updateValueAndValidity();
    this.form.get('tasa2')?.updateValueAndValidity();
    this.form.get('ves3')?.updateValueAndValidity();
    this.form.get('tasa3')?.updateValueAndValidity();
  }

  loadConfig(): void {
    this.api.getConfig().subscribe(cfg => {
      if (cfg) {
        // detectar tasa única si tramos 2 y 3 vienen null
        this.tasaUnica = (cfg.ves2 == null && cfg.tasa2 == null && cfg.ves3 == null && cfg.tasa3 == null);

        // patch
        this.form.patchValue(cfg);

        // aplicar reglas de validación según modo
        this.onToggleTasaUnica();
      }
      this.loading = false;
    });
  }

  private loadSaldoVes(): void {
    this.balanceService.listar().subscribe({
      next: (balances) => {
        if (balances && balances.length > 0) {
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

    const v = this.form.value;

    const dto: VesConfigDto = {
      ves1: v.ves1,
      tasa1: v.tasa1,

      ves2: this.tasaUnica ? null : v.ves2,
      tasa2: this.tasaUnica ? null : v.tasa2,

      ves3: this.tasaUnica ? null : v.ves3,
      tasa3: this.tasaUnica ? null : v.tasa3,
    };

    this.api.updateConfig(dto).subscribe(() => {
      alert('Configuración guardada');
    });
  }

  // =======================
  // GENERAR IMAGEN
  // =======================
  generateImage(): void {
    if (this.tasaUnica) {
      this.generateImageTasaUnica();
    } else {
      this.generateImageMulti();
    }
  }

  // tu lógica original (3 tasas) pero usando baseImagePathMulti
  private generateImageMulti(): void {
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.src = this.baseImagePathMulti;

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';

      const xPesos = canvas.width * 0.27;
      const xTasa  = canvas.width * 0.50;
      const xVes   = canvas.width * 0.77;

      const y1 = canvas.height * 0.43;
      const y2 = canvas.height * 0.52;
      const y3 = canvas.height * 0.61;

      const boxWidth  = canvas.width * 0.20;
      const boxHeight = canvas.height * 0.05;

      const drawBox = (cx: number, cy: number) => {
        ctx.fillStyle = 'rgba(0,0,0,0.65)';
        ctx.fillRect(cx - boxWidth / 2, cy - boxHeight / 2, boxWidth, boxHeight);
      };

      const now = new Date();
      const meses = ['ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO','JULIO','AGOSTO','SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE'];
      const fechaTxt = `${now.getDate()} ${meses[now.getMonth()]}`;

      ctx.font = `${canvas.height * 0.035}px Arial`;
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'right';
      ctx.fillText(fechaTxt, canvas.width * 0.92, canvas.height * 0.19);
      ctx.textAlign = 'center';

      const headerY = canvas.height * 0.36;
      drawBox(xPesos, headerY); drawBox(xTasa, headerY); drawBox(xVes, headerY);

      ctx.font = `${canvas.height * 0.03}px Arial`;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText('PESOS', xPesos, headerY);
      ctx.fillText('TASA', xTasa, headerY);
      ctx.fillText('BS', xVes, headerY);

      const v = this.form.value;

      const pesos1Txt = `$${this.formatNumber(this.pesos1)}`;
      const pesos2Txt = `$${this.formatNumber(this.pesos2)}`;
      const pesos3Txt = `$${this.formatNumber(this.pesos3)}`;

      const tasa1Txt = this.formatNumber(v.tasa1);
      const tasa2Txt = this.formatNumber(v.tasa2);
      const tasa3Txt = this.formatNumber(v.tasa3);

      const ves1Txt = this.formatNumber(v.ves1);
      const ves2Txt = this.formatNumber(v.ves2);
      const ves3Txt = this.formatNumber(v.ves3);

      [y1,y2,y3].forEach(y => { drawBox(xPesos,y); drawBox(xTasa,y); drawBox(xVes,y); });

      ctx.font = `${canvas.height * 0.035}px Arial`;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(pesos1Txt, xPesos, y1);
      ctx.fillText(pesos2Txt, xPesos, y2);
      ctx.fillText(pesos3Txt, xPesos, y3);

      ctx.font = `${canvas.height * 0.038}px Arial`;
      ctx.fillStyle = '#FFD600';
      ctx.fillText(tasa1Txt, xTasa, y1);
      ctx.fillText(tasa2Txt, xTasa, y2);
      ctx.fillText(tasa3Txt, xTasa, y3);

      ctx.font = `${canvas.height * 0.035}px Arial`;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(ves1Txt, xVes, y1);
      ctx.fillText(ves2Txt, xVes, y2);
      ctx.fillText(ves3Txt, xVes, y3);

      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `tasas_${fechaTxt.replace(' ', '_')}.png`;
      link.click();
    };
  }

  // NUEVA: tasa única con plantilla ves-tasa-unica.jpg
  private generateImageTasaUnica(): void {
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.src = this.baseImagePathUnica;

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      // texto grande centrado (ajusta si hace falta)
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';

      const tasa = this.form.value.tasa1 ?? 0;

      // Sombra suave + dorado (tipo ejemplo)
      ctx.font = `${canvas.height * 0.12}px Arial`;
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillText(this.formatRate(tasa), canvas.width * 0.50 + 3, canvas.height * 0.62 + 3);

      ctx.fillStyle = '#F5D37B';
      ctx.fillText(this.formatRate(tasa), canvas.width * 0.50, canvas.height * 0.62);

      const now = new Date();
      const meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
      const fechaTxt = `${now.getDate()} ${meses[now.getMonth()]}`;

      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `tasa_unica_${fechaTxt.replace(' ', '_')}.png`;
      link.click();
    };
  }

  private formatNumber(value: number): string {
    if (value == null) return '0';
    return Math.round(value).toLocaleString('es-CO');
  }

  private formatRate(value: number): string {
    if (value == null) return '0.00';
    // 9.0 como el ejemplo, o 9,00 depende de tu preferencia:
    return Number(value).toLocaleString('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 2 });
  }
}
