import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, HostListener, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, EMPTY, finalize, forkJoin, map, of, tap } from 'rxjs';
import { PublicFormsService } from '../../services/public-form.service';
import { FormsService } from '../../services/forms.service';
import { FeedbackService } from '../../services/feedback.service';
import { FormField } from '../../model/form-field.model';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatFormField, MatLabel, MatError, MatSelectModule } from "@angular/material/select";
import { MatOption, provideNativeDateAdapter } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { getFormFieldGridColumn } from '../../utils/form-grid-layout.util';
@Component({
  selector: 'app-preview-landing',
  standalone: true,
  providers: [provideNativeDateAdapter()],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatSlideToggleModule,
    MatFormField,
    MatLabel,
    MatIconModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatOption,
    MatSelectModule
  ],
  templateUrl: './preview-landing.component.html',
  styleUrls: ['./preview-landing.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PreviewLandingComponent {

  private formService = inject(PublicFormsService);
  private adminFormService = inject(FormsService);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private feedback = inject(FeedbackService);
  private destroyRef = inject(DestroyRef);

  @ViewChild('resultsSection')
  resultsSection?: ElementRef;

  items = signal<FormField[]>([]);
  resultsVisible = signal(false);
  previewMode = signal(true);
  loading = signal(false);

  formSettings = signal<any>({});
  imageUrls = signal<Record<string,string>>({});
  formId = this.route.snapshot.paramMap.get('id') ?? '';
  form = this.fb.group({});

  constructor() {
    this.loadConfig();
  }

  @HostListener('document:click')
  closeAllSelects() {
    this.items.update(items =>
      items.map(i => ({ ...i, open: false }))
    );
  }

  private loadConfig() {
    if (!this.formId) {
      this.notifyError('No se encontró el formulario');
      return;
    }

    const preview = this.route.snapshot.queryParamMap.get('preview');
    this.previewMode.set(preview === 'true');

    this.loading.set(true);

    this.formService.getConfig(this.formId)
      .pipe(
        tap(res => this.buildForm(res)),
        tap(() => this.loadImages()),
        catchError(err => {
          this.notifyError(
            err.message || 'Error cargando configuración'
          );
          return EMPTY;
        }),
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  private buildForm(res: any) {
    const parsed = JSON.parse(res.json);
    const items = this.sortItems(parsed.fields ?? []);

    this.items.set(items);
    this.formSettings.set(parsed.settings ?? {});

    const group: any = {};

    items.forEach(field => {
      const validators = [];
      if (field.required) {
        validators.push(Validators.required);
      }
      if (field.type === 'email') {
        validators.push(Validators.email);
      }

      const value =
        field.type === 'date'
          ? this.toDateControlValue(field.value)
          : field.type === 'checkbox'
            ? !!field.value
            : field.value ?? '';

      if (field.key && !field.isResult) {
        group[field.key] = [value, validators];
      }
    });

    this.form = this.fb.group(group);
  }

  private toDateControlValue(value: FormField['value']): Date | null {
    if (value === undefined || value === null) {
      return new Date();
    }

    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? null : value;
    }

    if (typeof value !== 'string' || value.length === 0) {
      return null;
    }

    const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (dateOnly) {
      const year = Number(dateOnly[1]);
      const month = Number(dateOnly[2]);
      const day = Number(dateOnly[3]);
      const date = new Date(year, month - 1, day);

      return date.getFullYear() === year &&
        date.getMonth() === month - 1 &&
        date.getDate() === day
        ? date
        : null;
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private loadImages() {
    const images = this.items()
      .filter(i => i.type === 'image' && i.fileId);

    if (!images.length) return;

    forkJoin(
      images.map(img =>
        this.formService.getImageBlob(this.formId, img.fileId!)
          .pipe(
            map(blob => ({ blob, img })),
            catchError(() => of(null))
          )
      )
    )
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe(results => {
      results
      .filter(r => r !== null)
      .forEach(({ blob, img }) => {
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = reader.result as string;
          this.imageUrls.update(v => ({
            ...v,
            [img.fileId!]: dataUrl
          }));
        };

        reader.readAsDataURL(blob);
      });
    });
  }

  executeCalculation() {

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.notifyError('Completá los campos obligatorios');
      return;
    }

    this.loading.set(true);

    const values: Record<string, any> = this.form.getRawValue();

    Object.keys(values).forEach(key => {
      if (values[key] instanceof Date) {
        const date = values[key] as Date;
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        values[key] = `${year}-${month}-${day}`;
      }
    });

    const calculate$ = this.previewMode()
      ? this.adminFormService.calculate(this.formId, values, true)
      : this.formService.calculate(this.formId, values);

    calculate$
    .pipe(
      tap(res => {

        const parsed = JSON.parse(res.resultsJson);
        const values = parsed.values ?? {};

        this.items.update(items =>
          items.map(i => ({
            ...i,
            value: i.isResult
              ? values[i.key!] ?? i.value
              : i.value
          }))
        );

        this.resultsVisible.set(true);

        queueMicrotask(() => {
          this.resultsSection?.nativeElement
            ?.scrollIntoView({
              behavior: 'smooth'
            });
        });

        this.feedback.notifyMessage({
          message: 'Cálculo ejecutado correctamente',
          type: 'success'
        });
      }),
      catchError(err => {
        console.error('Error ejecutando cálculo:', err);

        const message = this.getCalculationErrorMessage(err);

        this.notifyError(message);

        return EMPTY;
      }),
      finalize(() => this.loading.set(false)),
      takeUntilDestroyed(this.destroyRef)
    )
    .subscribe();
  }

  private getCalculationErrorMessage(err: any): string {
    return err?.error?.message || err?.message
      || 'No se pudo ejecutar el cálculo. Revisá los datos ingresados e intentá nuevamente.';
  }

  trackByKey = (_: number, item: FormField) => item.key || item.label;

  private sortItems(items: FormField[]) {
    return [...items].sort((a,b) => {
      if (a.isResult && !b.isResult) return 1;
      if (!a.isResult && b.isResult) return -1;
      return 0;
    });
  }

  private notifyError(message: string) {
    this.feedback.notifyMessage({
      message,
      type: 'danger'
    });
  }

  getInputStyles(item: FormField) {
    const control = this.form?.get(item.key || '');
    const invalid =
      !!control &&
      control.invalid &&
      control.touched;

    return {
      'font-size': item.fontSize || '16px',
      'color': item.inputColor || item.color || '#111111',
      'font-family': item.fontFamily || 'Arial',
      'font-weight': item.fontWeight || '500',
      'text-align': item.textAlign || 'center',
      'border':
        item.border === false
          ? 'none'
          : `1px solid ${
              invalid
                ? 'red'
                : (item.borderColor || '#ccc')
            }`,
      'background-color':
        item.backgroundColor ||
        (item.isResult ? '#f3f4f6' : 'transparent'),
      'width': '100%',
      'padding': '6px 8px',
      'border-radius': '4px'
    };
  }

  getJustifyContent(
    value?: 'top' | 'center' | 'bottom'
  ): 'start' | 'center' | 'end' {

    switch (value) {
      case 'top':
        return 'start';
      case 'center':
        return 'center';
      case 'bottom':
        return 'end';
      default:
        return 'start';
    }
  }

  getFieldGridColumn(item: FormField): string {
    return getFormFieldGridColumn(item);
  }

  private calcMinHeight(
    item: FormField
  ): string {
    if (item.type === 'form-title') {
      return '80px';
    }

    if (
      item.justifyContent === 'top' ||
      item.justifyContent === 'bottom'
    ) {
      const size =
        parseInt(item.fontSize || '16', 10);

      return `${Math.max(size + 24, 48)}px`;
    }

    return 'auto';
  }

  getMinHeight(item: FormField): string {
    return this.calcMinHeight(item);
  }

  toggleSelect(item: FormField) {
    this.items.update(items =>
      items.map(i => ({
        ...i,
        open: i.id === item.id ? !i.open : false
      }))
    );
  }

  selectOptionPreview( item: FormField, option: any ) {
    this.form
      .get(item.key!)
      ?.setValue(option.value);
    this.items.update(items =>
      items.map(i =>
        i.id === item.id
          ? { ...i, open: false }
          : i
      )
    );
  }

  getLabel(item: FormField) {
    const value =
      this.form.get(item.key ?? '')
        ?.value;

    const found =
      item.values?.find(
        (opt: any) =>
          opt.value === value
      );

    return (
      found?.name ||
      item.placeholder ||
      'Seleccione una opción'
    );
  }

}
