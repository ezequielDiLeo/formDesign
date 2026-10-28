import { Component, OnInit, inject, signal, viewChild, effect, computed } from '@angular/core';
import { FieldType, FormField, FormModel, stripTransientFieldState } from '../../model/form-field.model';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { CalculationDefinition, CalculationParameter, FormsService } from '../../services/forms.service';
import { FeedbackService } from '../../services/feedback.service';
import { ActivatedRoute, Router } from '@angular/router';
import { FIELD_PROPERTIES, COMMON_PROPERTIES, DEFAULT_FIELD_VALUES } from '../../constants/field-properties.config';
import { PropertyConfig } from '../../model/form-field.model';
import { BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS, FONTS, IMAGE_SIZES, LINE_STYLE, LINE_THICKNESS } from '../../constants/combo.constants';
import { CanvasComponent } from '../canvas/canvas.component';
import { CommonModule } from '@angular/common';
import { PropertiesComponent } from "../properties/properties.component";
import { ToolboxComponent } from "../toolbox/toolbox.component";

@Component({
  selector: 'app-landing-page',
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    CanvasComponent,
    PropertiesComponent,
    ToolboxComponent
  ]
})
export class LandingPageComponent implements OnInit {

  readonly canvasComponent = viewChild.required(CanvasComponent);

  isDarkMode = signal(false);
  formName = signal<string>('');
  calcDefOid = signal<string>('');
  formId = signal<string>('');
  group = signal<string>('');
  executionParams = signal<CalculationParameter[]>([]);
  selectedField = signal<FormField | null>(null);
  canvasListRef = signal<any | null>(null);

  route = inject(ActivatedRoute);
  router = inject(Router);
  formsService = inject(FormsService);
  feedback = inject(FeedbackService);

  canvasFields = computed (
    () => this.formModel()?.fields || []
  )
  inputFields = computed(
    () => this.canvasFields().filter(f => !f.isResult)
  );

  resultFields = computed(
    () => this.canvasFields().filter(f => f.isResult)
  );
  propertiesConfig = computed<PropertyConfig[]>(() => {
    const field = this.selectedField();
    if (!field) return [];

    const width = field.width ?? '100%';
    const specific = FIELD_PROPERTIES[field.type] || [];
    let common = [...COMMON_PROPERTIES];

    if ( width === '100%'  ) {
      common = common.filter(prop =>
        prop.key !== 'containerAlign'
      );
    }
    if (field.type === 'line') {
      common = common.filter(prop =>
        prop.key !== 'textAlign'
      );
    }
    if (field.type === 'image') {
      common = common.filter(prop =>
        prop.key !== 'textAlign'
      );
    }
    // EMAIL, NUMBER y SELECT no muestran "Alineación"
    if (['email', 'number', 'select'].includes(field.type)) {
      common = common.filter(prop =>
        prop.key !== 'textAlign'
      );
    }


    let properties = [...common, ...specific];

    if (field.type === 'text' && field.key) {
      properties.push(
        { type: 'checkbox', label: 'Mostrar borde', key: 'border' },
        { type: 'color', label: 'Color borde', key: 'borderColor' }
      );
    }

    properties = properties.filter(prop => {
      if (prop.label?.toLowerCase().includes('color') && prop.key === 'color') {
        return !!field.key || field.type === 'button' || field.type === 'line' ||  field.type === 'form-title';
      }

      if (prop.key === 'border' || prop.key === 'borderColor') {
        return !(field.type === 'text' && !field.key);
      }

      return true;
    });

    return properties;
  });

  constructor() {
    effect(() => {
      const canvas = this.canvasComponent();

      if (canvas?.canvasList()) {
        this.canvasListRef.set(canvas.canvasList());
      }
    });
  }


  private syncCanvasTypesWithExecutionParams() {
    if (!this.executionParams().length) return;
    if (!this.formModel()?.fields?.length) return;

    this.formModel.update(m => ({
      ...m,
      fields: m.fields.map(field => {

        if (!field.fromCalculation || !field.key) {
          return field;
        }

        const backendParam =
          this.executionParams()
            .find(p => p.name === field.key);

        if (!backendParam) {
          return field;
        }

        const hasValues = (backendParam.values?.length ?? 0) > 0;

        return {
          ...field,
          type: hasValues
            ? 'select'
            : this.mapBackendType(
                backendParam.type,
                backendParam.name
              ),
          values: hasValues
            ? backendParam.values
            : field.values
        };
      })
    }));
  }

  private normalizeSelectValue(value: any, options: any[], fallback: any) {
    const validValues = options.map(o => typeof o === 'string' ? o : o.value);
    return validValues.includes(value) ? value : fallback;
  }

  private normalizeField(field: FormField): FormField {
    const defaults = DEFAULT_FIELD_VALUES[field.type] || {};
    const normalized: any = { ...field };

    Object.keys(defaults).forEach(key => {
      if (!(key in normalized) || normalized[key] === null) {
        normalized[key] = defaults[key];
      }
    });

    normalized.fontFamily = this.normalizeSelectValue(
      normalized.fontFamily,
      FONTS,
      defaults.fontFamily || 'Arial'
    );

    normalized.fontSize = this.normalizeSelectValue(
      normalized.fontSize,
      FONT_SIZES,
      defaults.fontSize || '16px'
    );

    normalized.fontWeight = this.normalizeSelectValue(
      normalized.fontWeight,
      FONT_WEIGHTS,
      defaults.fontWeight || '400'
    );

    if (normalized.type === 'image') {
      normalized.imageHeight = this.normalizeSelectValue(
        normalized.imageHeight,
        IMAGE_SIZES,
        defaults.imageHeight || '150px'
      );

      normalized.borderRadius = this.normalizeSelectValue(
        normalized.borderRadius,
        BORDER_RADIUS,
        defaults.borderRadius || '0px'
      );
    }

    if (normalized.type === 'line') {
      normalized.height = this.normalizeSelectValue(
        normalized.height,
        LINE_THICKNESS,
        defaults.height || '1px'
      );

      normalized.borderStyle = this.normalizeSelectValue(
        normalized.borderStyle,
        LINE_STYLE,
        defaults.borderStyle || 'solid'
      );
    }

    if (!normalized.fontFamily) {
      normalized.fontFamily = 'Arial';
    }

    return normalized as FormField;
  }

  toolboxSections = signal<{ title: string; icon: string; fields: FormField[] }[]>([
    {
      title: 'Objetos de diseño',
      icon: 'palette',
      fields: [
        {
          id: 't1',
          type: 'text',
          label: 'Texto Informativo',
          x: 0,
          y: 0,
          width: '100%',
          fontFamily: 'Arial'
        },
        {
          id: 't2',
          type: 'line',
          label: 'Línea horizontal',
          x: 0,
          y: 0,
          width: '100%',
          color: '#000000',
          borderStyle: 'solid'
        },
        {
          id: 't3',
          type: 'button',
          label: 'Botón de calcular',
          x: 0,
          y: 0,
          width: '100%',
          color: '#ffffff',
          backgroundColor: '#2563eb',
          fontFamily: 'Arial',
          breakLine: true
        },
        {
          id: 't4',
          type: 'image',
          label: 'Imagen',
          x: 0,
          y: 0,
          width: '100%',
          fontSize: '16px',
          imageHeight: '152px'
        },
        {
          id: 't5',
          type: 'date',
          label: 'Fecha',
          x: 0,
          y: 0,
          width: '100%',
          color: '#000000',
          fontFamily: 'Arial'
        }
      ]
    },
    {
      title: 'Objetos de ingreso',
      icon: 'input',
      fields: []
    },
    {
      title: 'Objetos de salida',
      icon: 'functions',
      fields: []
    }
  ]);

  formModel = signal<FormModel>({
    settings: {
      backgroundColor: '#ffffff',
      padding: '40px',
      maxWidth: '800px',
      borderRadius: '8px'
    },
    fields: [
      {
        id: crypto.randomUUID(),
        type: 'form-title',
        label: 'TITULO DEL FORMULARIO',
        x: 0,
        y: 0,
        width: '100%',
        fontSize: '24px',
        color: '#111111',
        fontFamily: 'Arial',
        fontWeight: '500',
        deletable: true,
      }
    ]
  });


  ngOnInit(): void {
    this.formId.set(this.route.snapshot.paramMap.get('id')!);
    if (!this.formId()) return;

    this.formsService.getById(this.formId()).subscribe({
      next: (form: any) => {
        this.formName.set(form.name);
        this.group.set(form.group);
        if (this.group()) {
          this.loadActiveCalcForGroup(this.group());
        }
        this.loadConfig();
      },
      error: (err: any) => {
        console.error('Error loading form:', err);
        alert('Error cargando el formulario');
      }
    });
  }

  loadConfig() {
    this.formsService.getConfig(this.formId()).subscribe({
      next: (result) => {
        if (!result?.json) {
          if (this.group()) {
            this.loadActiveCalcForGroup(this.group());
          }
          return;
        }
        const parsed = JSON.parse(result.json);
        const normalizedFields = (parsed.fields || []).map((f: FormField) =>
          this.normalizeField(f)
        );

        this.formModel.set({
          ...parsed,
          fields: normalizedFields
        });

        this.formModel().fields.forEach(field => {
          if (field.type !== 'image' || !field.fileId) return;


          this.formsService.getImageBlob(field.fileId).subscribe({
            next: (blob) => {

              const reader = new FileReader();

              reader.onload = () => {
                this.formModel.update(m => ({
                  ...m,
                  fields: m.fields.map(f =>
                    f.id === field.id
                      ? { ...f, src: reader.result as string }
                      : f
                  )
                }));
              };

              reader.readAsDataURL(blob);
            },

            error: (err) => {
              console.warn('Imagen no encontrada:', field.fileId, err);
              this.formModel.update(m => ({
                ...m,
                fields: m.fields.map(f =>
                  f.id === field.id
                    ? { ...f, src: undefined, fileId: undefined }
                    : f
                )
              }));
            }
          });
        });

        this.syncCanvasTypesWithExecutionParams();

        setTimeout(() => {
          this.formModel.update(m => ({ ...m }));
        }, 0);
      },

      error: (err) => {
        console.error('Error loading form config:', err);
      }
    });
  }

  // Resolves the group's active version the same way the backend does at execution time
  // (validSince <= today < validUntil, highest calcVersion on ties), then loads its fields
  // for the designer. A non-draft row with an open validUntil is not necessarily today's
  // version — a future activation can already exist with validUntil:null.
  loadActiveCalcForGroup(group: string) {
    this.formsService.getCalcsTable({
      page: 1,
      size: 9999,
      filter: group,
      exactMatch: true,
      isDraft: false
    }).subscribe({
      next: (res) => {
        const active = this.resolveActiveCalc(res.data);
        if (active) {
          this.calcDefOid.set(active.oid);
          this.loadExecutionParams(active.oid);
        }
      },
      error: (err) => {
        console.error('Error resolving active calculation for group:', err);
        this.feedback.notifyMessage({
          message: this.feedback.errorMessage(err, 'No se pudo cargar el cálculo asociado.'),
          type: 'danger'
        });
      }
    });
  }

  private resolveActiveCalc(rows: CalculationDefinition[]): CalculationDefinition | null {
    const today = new Date().toISOString().split('T')[0];
    const active = rows.filter(r =>
      (!r.validSince || r.validSince <= today) &&
      (!r.validUntil || r.validUntil > today)
    );
    return active.reduce<CalculationDefinition | null>((best, row) =>
      !best || row.calcVersion > best.calcVersion ? row : best, null);
  }

  loadExecutionParams(oid: string): void {
    this.formsService.getCalc(oid).subscribe({
      next: (res) => {
        this.executionParams.set((res.executionParameters ?? [])
          .filter((p: any) => p.name?.toLowerCase() !== 'operationdate'));

        const inputFields: FormField[] = this.executionParams().map(p => {
          const hasValues = p.values && p.values.length > 0;

          const type = hasValues ? 'select' : this.mapBackendType(p.type, p.name);

          const defaults = DEFAULT_FIELD_VALUES[type] || {};

          return {
            ...defaults,
            id: crypto.randomUUID(),
            type: hasValues ? 'select' : this.mapBackendType(p.type),
            label: this.capitalize(p.name),
            x: 0,
            y: 0,
            width: '100%',
            required: p.required,
            key: p.name,
            fromCalculation: true,
            deletable: true,
            values: p.values,
            value: p.defaultValue ?? '',
            placeholder: `Ingrese ${this.capitalize(p.name)}`,
          };
        });

        const resultsFields: FormField[] = res.resultsFields.map((name: string) => ({
          id: crypto.randomUUID(),
          type: 'number',
          label: this.capitalize(name),
          x: 0,
          y: 0,
          width: '100%',
          key: name,
          fromCalculation: true,
          isResult: true,
          deletable: true,
          placeholder: 'Resultado',
          readonly: true
        }));

        this.toolboxSections.update(sections =>
          sections.map(section => {

            if (section.title === 'Objetos de ingreso') {
              return {
                ...section,
                fields: inputFields
              };
            }

            if (section.title === 'Objetos de salida') {
              return {
                ...section,
                fields: resultsFields
              };
            }

            return section;
          })
        );

        this.syncCanvasTypesWithExecutionParams();
      },
      error: (err) => {
        console.error('Error loading calculation details:', err);
        this.feedback.notifyMessage({
          message: this.feedback.errorMessage(err, 'Error cargando detalles del formulario.'),
          type: 'danger'
        });
      }
    });
  }

  mapBackendType(type: number, name?: string): FieldType {
    if (name?.toLowerCase() === 'email') return 'email';
    switch (type) {
      case 1: return 'text';
      case 2: return 'number';
      case 3: return 'date';
      case 4: return 'checkbox';
      case 5: return 'form-title';
      default: return 'text';
    }
  }

  capitalize(value: string): string {
    if (!value) return '';
    return value
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase());
  }

  drop(event: CdkDragDrop<FormField[]>) {
    if (event.previousContainer === event.container) {
      const reorderedInputs = [...event.container.data];
      moveItemInArray(
        reorderedInputs,
        event.previousIndex,
        event.currentIndex
      );
      const results = this.resultFields();
      this.formModel.update(m => ({ ...m, fields: [...reorderedInputs, ...results] }));
      return;
    }

    const original = event.previousContainer.data[event.previousIndex];
    const defaults = DEFAULT_FIELD_VALUES[original.type] || {};

    if (original.fromCalculation) {
      const alreadyExists = this.formModel().fields.some(f =>
        f.fromCalculation && f.key === original.key
      );
      if (alreadyExists) {
        this.feedback.notifyMessage({ message: 'Este campo ya fue agregado.', type: 'danger' });
        return;
      }
    }

    const newItem: FormField = {
      ...defaults,
      ...original,
      id: crypto.randomUUID(),
      width: original.width ?? '100%',
      border: original.border ?? true,
      borderColor: '#ccc',
      textAlign: 'center',
      fontSize: original.fontSize || defaults.fontSize || '16px',
      fontFamily: original.fontFamily || defaults.fontFamily || 'Arial',
      fontWeight: original.fontWeight || defaults.fontWeight || '500',
      imageHeight: original.imageHeight || defaults.imageHeight || '152px',
      breakLine: original.breakLine ?? false,
    };

    if (newItem.type === 'date') {
      newItem.value = new Date().toISOString().split('T')[0];
    }

    const updatedFields = [...this.formModel().fields];

    if (newItem.isResult) {
      updatedFields.push(newItem);
    } else {
      const insertionIndex = Math.max(
        0,
        Math.min(event.currentIndex, this.inputFields().length)
      );
      updatedFields.splice(insertionIndex, 0, newItem);
    }

    this.formModel.update(m =>({
      ...m,
      fields: updatedFields
    }));

    this.selectField(newItem);
  }

  selectField(field: FormField) {
    this.updateCoordinates();
    this.selectedField.set(field);

    const defaults = DEFAULT_FIELD_VALUES[field.type] || {};

    if (!field.fontSize || !FONT_SIZES.includes(field.fontSize)) {
      this.selectedField.set({
        ...field,
        fontSize: defaults.fontSize || '16px'
      })
    }

    setTimeout(() => {
      const updated: any = {
        ...field
      };
      Object.keys(defaults).forEach(key => {
        if (
          updated[key] === undefined ||
          updated[key] === null ||
          updated[key] === ''
        ) {
          updated[key] = defaults[key];
        }
      });
      this.selectedField.set(updated);
    });
  }

  updateSelectedField(updatedField: FormField) {
    this.selectedField.set(updatedField);

    this.formModel.update(m => ({
      ...m,
      fields: m.fields.map(f =>
        f.id === updatedField.id
          ? updatedField
          : f
      )
    }));
  }

  deleteField(field: FormField) {
    if (field.tempSrc) URL.revokeObjectURL(field.tempSrc);
    this.formModel.update(m => ({
      ...m,
      fields: m.fields.filter(f => f.id !== field.id)
    }));

    if (this.selectedField()?.id === field.id) {
      this.selectedField.set(null);
    }
  }

  updateCoordinates() {
    let currentX = 0;
    let currentY = 0;
    const rowHeight = 100;

    const updated =
      this.formModel().fields.map(item => {
        let widthVal = 100;
        if (item.width?.includes('%')) {
          widthVal =
            parseInt(item.width,10);
        }
        if(item.breakLine){
          currentX = 0;
          currentY += rowHeight;
        }
        if (
          currentX + widthVal > 100 &&
          currentX > 0
        ) {
          currentX = 0;
          currentY += rowHeight;
        }
        const updatedItem = {
          ...item,
          x: currentX,
          y: currentY
        };

        currentX += widthVal;
        if (currentX >= 100) {
          currentX = 0;
          currentY += rowHeight;
        }
        return updatedItem;
      });

    this.formModel.update(m => ({
      ...m,
      fields: updated
    }));
  }

  save() {
    this.updateCoordinates();
    const json = JSON.stringify(this.buildPersistableModel());
    this.formsService.saveConfig(this.formId(), json).subscribe({
      next: () => {
        this.router.navigate(['/formularios']);
        this.feedback.notifyMessage({ message: 'Configuración guardada exitosamente.', type: 'success' });
      },
      error: err => {
        console.error(err);
        this.feedback.notifyMessage({
          message: this.feedback.errorMessage(err, 'Error guardando configuración.'),
          type: 'danger'
        });
      }
    });
  }

  preview() {
    this.updateCoordinates();
    const json = JSON.stringify(this.buildPersistableModel());
    this.formsService.saveConfig(this.formId(), json).subscribe({
      next: () => {
        const url = `${window.location.origin}/preview-landing/${this.formId()}?preview=true`;
        window.open(url, '_blank');
      },
      error: err => {
        console.error('Error guardando antes de preview:', err);
        this.feedback.notifyMessage({
          message: this.feedback.errorMessage(err, 'Error generando vista previa.'),
          type: 'danger'
        });
      }
    });
  }

  // Does not mutate this.formModel(), which keeps `src` for in-memory editor rendering.
  private buildPersistableModel(): FormModel {
    return stripTransientFieldState(this.formModel());
  }

  selectBackground(event: Event) {
    this.selectedField.set(null);
  }

  uploadImage(event: any) {
    const file: File = event?.target?.files?.[0];
    const currentField = this.selectedField();
    if (!file || !currentField) return;
    this.formsService.uploadImage(this.formId(), file).subscribe({
      next: (res: any) => {
        const storageId = res?.fileId;
        if (!storageId) {
          this.feedback.notifyMessage({
            message: 'Backend no devolvió ID de imagen',
            type: 'danger'
          });
          return;
        }

        const localUrl = URL.createObjectURL(file);

        this.selectedField.update(f =>
          f ? {
            ...f,
            fileId: storageId,
            tempSrc: localUrl,
            src: localUrl,
            fileName: file.name
          } : null
        );

        this.formModel.update(m => ({
          ...m,
          fields: m.fields.map(f =>
            f.id === currentField.id
              ? {
                  ...f,
                  fileId: storageId,
                  tempSrc: localUrl,
                  src: localUrl,
                  fileName: file.name
                }
              : f
          )
        }));

        event.target.value = null;
      },

      error: (err) => {
        console.error('Error subiendo la imagen:', err);
        this.feedback.notifyMessage({
          message: 'Error subiendo la imagen',
          type: 'danger'
        });
      }
    });
  }

  goBack() {
    this.router.navigate(['/formularios/edit', this.formId()]);
  }

  updateTheme() {
    this.isDarkMode.set(this.formModel().settings.backgroundColor === '#000000');
  }
}
