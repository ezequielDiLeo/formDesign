
import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsService } from '../../services/forms.service';
import { FeedbackService } from '../../services/feedback.service';
import { FieldType, FormField, FormModel, stripTransientFieldState } from '../../model/form-field.model';
import { CalculationDefinition, CalculationParameter } from '../../services/forms.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-landing-page-edit',
  templateUrl: './landing-page-edit.component.html',
  styleUrl: './landing-page-edit.component.scss',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatButtonModule,
    MatProgressBarModule
]
})
export class LandingPageEditComponent {

  innerForm!: FormGroup;
  isEditMode = false;
  formId: string | null = null;
  calcs: CalculationDefinition[] = [];
  generatedFields: FormField[] = [];
  originalGroup: string | null = null;
  loading = signal(true);

  constructor(
    private fb: FormBuilder,
    private service: FormsService,
    private route: ActivatedRoute,
    public router: Router,
    private feedback: FeedbackService
  ) {}

  ngOnInit(): void {

    this.innerForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      group: ['', Validators.required]
    });

    this.formId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.formId;

    this.innerForm.get('group')?.valueChanges.subscribe(group => {

      if (this.isEditMode && this.originalGroup && group !== this.originalGroup) {

        this.feedback.notifyMessage({message:'No se puede cambiar el cálculo en un formulario existente. Si quieres usar otro cálculo, crea un nuevo formulario.', type:'danger'});
        this.innerForm.get('group')?.setValue(this.originalGroup, { emitEvent: false });

        return;
      }

      const calc = this.calcs.find(c => c.group === group);
      if (calc) {
        this.loadCalcDefinition(calc.oid);
      }
    });

    this.loadCalcs();
  }

  loadCalcs() {
    const params = {
      page: 1,
      size: 9999,
      orderField: 'group',
      inverse: false,
      isDraft: false
    };

    this.service.getCalcsTable(params).subscribe({
      next: (res) => {
        this.calcs = this.resolveActiveByGroup(res.data);

        if (this.isEditMode && this.formId) {
          this.loadForm();
        } else {
          this.loading.set(false);
        }
      },
      error: (err) => {
        this.feedback.notifyMessage({
          message: this.feedback.errorMessage(err, 'Error al cargar los cálculos.'),
          type: 'danger'
        });
        console.error('Error loading calcs:', err);
        this.loading.set(false);
      }
    });
  }

  loadForm() {
    this.service.getById(this.formId!).subscribe({
      next: (res) => {
        this.innerForm.patchValue({
          name: res.name,
          description: res.description,
          group: res.group
        });
        this.originalGroup = res.group;
        this.loading.set(false);
      },
      error: (err) => {
        this.feedback.notifyMessage({
          message: this.feedback.errorMessage(err, 'Error al cargar el formulario.'),
          type: 'danger'
        });
        console.error('Error loading form:', err);
        this.loading.set(false);
      },
    });
  }

  // Keeps, per group, the version active today (validSince <= today < validUntil), the same
  // rule the backend applies at execution time. Groups with no such version are dropped —
  // there is nothing to run a form against.
  private resolveActiveByGroup(rows: CalculationDefinition[]): CalculationDefinition[] {
    const today = new Date().toISOString().split('T')[0];
    const byGroup = new Map<string, CalculationDefinition>();

    rows
      .filter(r => (!r.validSince || r.validSince <= today) && (!r.validUntil || r.validUntil > today))
      .forEach(row => {
        const current = byGroup.get(row.group);
        if (!current || row.calcVersion > current.calcVersion) {
          byGroup.set(row.group, row);
        }
      });

    return Array.from(byGroup.values());
  }

  loadCalcDefinition(oid: string) {
    this.service.getCalc(oid).subscribe({
      next: (res) => {
        const execParams = res.executionParameters
          .filter(parameter => parameter.name !== 'operationDate');
        const input = this.mapExecutionParamsToFields(execParams, false);
        const output = res.resultsFields
          .filter(name => name !== 'operationDate')
          .map((name: string) => ({
            id: crypto.randomUUID(),
            type: 'number' as const,
            label: this.capitalize(name),
            key: name,
            fromCalculation: true,
            isResult: true,
            readonly: true
          }));
        this.generatedFields = [...input, ...output];
      },
      error: (err) => {
        this.feedback.notifyMessage({
          message: this.feedback.errorMessage(err, 'Error al cargar la definición del cálculo.'),
          type: 'danger'
        });
        console.error('Error loading calc definition:', err);
      }
    });
  }

  mapExecutionParamsToFields(params: CalculationParameter[], isResult = false): FormField[] {
    return params
    .filter(parameter => !!parameter.name)
    .map(parameter => {
      const isSelect = !!parameter.values?.length;

      return {
        id: crypto.randomUUID(),
        label: this.capitalize(parameter.name),
        type: isSelect ? 'select' : this.mapBackendType(parameter.type),
        key: parameter.name,
        required: parameter.required,
        fromCalculation: true,
        isResult: isResult,
        readonly: isResult,
        values: parameter.values || [],
        value: parameter.defaultValue ?? parameter.values?.[0]?.value ?? null
      };
    });
  }

  private capitalize(value: string): string {
    if (!value) return '';
    return value
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase());
  }

  mapBackendType(type: number): FieldType {
    switch (type) {
      case 1: return 'text';
      case 2: return 'number';
      case 3: return 'date';
      case 4: return 'email';
      default: return 'text';
    }
  }

saveAndContinue() {

  if (this.innerForm.invalid) {
    this.innerForm.markAllAsTouched();
    return;
  }
  const payload = {
    name: this.innerForm.value.name,
    description: this.innerForm.value.description,
    group: this.innerForm.value.group
  };

  if (this.isEditMode && this.formId) {
    this.service.update(this.formId, payload).subscribe({
      next: () => {
        this.service.getConfig(this.formId!).subscribe({
          next: (configRes) => {
            let parsed: FormModel;
            if (configRes?.json) {
              parsed = JSON.parse(configRes.json);
            } else {
              parsed = {
                settings: {
                  backgroundColor: '#ffffff',
                  padding: '40px',
                  maxWidth: '800px',
                  borderRadius: '8px'
                },
                fields: []
              };
            }
            parsed.fields = parsed.fields.filter(field => field.deletable !== false);
            const json = JSON.stringify(stripTransientFieldState(parsed));
            this.service.saveConfig(this.formId!, json).subscribe({
              next: () => {
                this.goToDesigner(this.formId!);
              },
              error: (err) => {
                this.feedback.notifyMessage({
                  message: this.feedback.errorMessage(err, 'Error al guardar la configuración.'),
                  type: 'danger'
                });
              }
            });

          },
          error: (err) => {
            this.feedback.notifyMessage({
              message: this.feedback.errorMessage(err, 'Error al obtener la configuración.'),
              type: 'danger'
            });
          }
        });

      },
      error: (err) => {
        this.feedback.notifyMessage({
          message: this.feedback.errorMessage(err, 'Error al actualizar el formulario.'),
          type: 'danger'
        });
        console.error(err);
      }
    });

  }
  else {
    this.service.create(payload).subscribe({
      next: (res) => {
        const formId = res.oid;
        const formModel = {
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
              label: payload.name,
              x: 0,
              y: 0,
              width: '100%',
              fontSize: '24px',
              color: '#111111',
              fontFamily: 'Arial',
              textAlign: 'left',
              deletable: true
            }
          ]
        };
        const json = JSON.stringify(stripTransientFieldState(formModel));
        this.service.saveConfig(formId, json).subscribe({
          next: () => {
            this.goToDesigner(formId);
          },
          error: (err) => {
            this.feedback.notifyMessage({
              message: this.feedback.errorMessage(err, 'Error al guardar la configuración.'),
              type: 'danger'
            });
          }
        });
      },
      error: (err) => {
        this.feedback.notifyMessage({
          message: this.feedback.errorMessage(err, 'Error al crear el formulario.'),
          type: 'danger'
        });
        console.error(err);
      }
    });
  }
}

  goToDesigner(id: string) {
    this.router.navigate(['/formulario/landing', id], {
      state: { generatedFields: this.generatedFields }
    });
  }

}
