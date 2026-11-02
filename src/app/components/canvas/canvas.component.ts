import { Component, input, output, signal, viewChild } from '@angular/core';
import { CdkDropList, CdkDragDrop, CdkDragPreview, DragDropModule } from '@angular/cdk/drag-drop';
import { FormField, FormModel } from '../../model/form-field.model';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { provideNativeDateAdapter, MatOption } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { getFormFieldMargin, getFormFieldWidth } from '../../utils/form-grid-layout.util';

@Component({
  selector: 'app-canvas',
  templateUrl: './canvas.component.html',
  styleUrls: ['./canvas.component.css'],
  standalone: true,
  providers: [provideNativeDateAdapter()],
  imports: [
    CommonModule,
    CdkDropList,
    CdkDragPreview,
    DragDropModule,
    FormsModule,
    MatIconModule,
    MatSlideToggleModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatOption,
    MatSelectModule
  ]
})
export class CanvasComponent {
  readonly formModel = input.required<FormModel>();
  readonly inputFields = input<FormField[]>([]);
  readonly resultFields = input<FormField[]>([]);
  readonly selectedField = input<FormField | null>(null);
  readonly isDarkMode = input(false);

  readonly dropped = output<CdkDragDrop<FormField[]>>();
  readonly fieldSelected = output<FormField>();
  readonly fieldDeleted = output<FormField>();
  readonly backgroundClicked = output<Event>();
  readonly saveClicked = output<void>();
  readonly previewClicked = output<void>();
  readonly backClicked = output<void>();
  readonly templateSelected = output<'brisa' | 'editorial' | 'naturaleza'>();


  readonly canvasList = viewChild.required<CdkDropList>('canvasList');

  readonly showTemplates = signal(false);

  readonly templates = [
    {
      id: 'brisa' as const,
      name: 'Brisa',
      description: 'Diseño luminoso en dos columnas y tonos azules.',
      previewClass: 'template-preview--brisa',
      hasPhoto: false
    },
    {
      id: 'editorial' as const,
      name: 'Editorial',
      description: 'Composición vertical, cálida y con tipografía elegante.',
      previewClass: 'template-preview--editorial',
      hasPhoto: false
    },
    {
      id: 'naturaleza' as const,
      name: 'Naturaleza',
      description: 'Imagen destacada, tonos verdes y campos de distinto tamaño.',
      previewClass: 'template-preview--naturaleza',
      hasPhoto: true
    }
  ];

  getPreviewFields(): FormField[] {
    return this.inputFields()
      .filter(field => !['form-title', 'line', 'image', 'button'].includes(field.type))
      .slice(0, 3);
  }

  getPreviewTitle(): string {
    return this.inputFields().find(field => field.type === 'form-title')?.label || 'Tu formulario';
  }

  private calcMinHeight(item: FormField): string {
    if (['text', 'form-title'].includes(item.type)) {
      return '80px';
    }
    return 'auto';
  }

  getJustifyContent(field: FormField | null | undefined): string {
    if (!field) return 'center';
    switch (field.justifyContent) {
      case 'top': return 'flex-start';
      case 'bottom': return 'flex-end';
      default: return 'center';
    }
  }

  getMinHeight(item: FormField): string {
    return this.calcMinHeight(item);
  }

  getBorderStyle(item: any): string {
    if (item.border === false) return 'none';
    const width = item.borderWidth || '1px';
    const style = item.borderStyle || 'solid';
    const color = item.borderColor || '#ccc';
    return `${width} ${style} ${color}`;
  }

  getFieldWidth(width?: string): string {
    return getFormFieldWidth(width);
  }

  getContainerStyle(field: FormField): string {
    return getFormFieldMargin(field);
  }

}
