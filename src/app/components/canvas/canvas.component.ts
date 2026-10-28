import { Component, input, output, viewChild } from '@angular/core';
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
import { getFormFieldGridColumn } from '../../utils/form-grid-layout.util';

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

  readonly canvasList = viewChild.required<CdkDropList>('canvasList');

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

  getFieldGridColumn(field: FormField): string {
    return getFormFieldGridColumn(field);
  }

  /**
   * Kept in case another template reference still uses the old helper.
   */
  getFieldWidth(width?: string): string {
    switch (width) {
      case '25%': return 'calc(25% - 4.5px)';
      case '33%': return 'calc(33.333% - 4px)';
      case '50%': return 'calc(50% - 3px)';
      case '66%': return 'calc(66.666% - 4px)';
      case '75%': return 'calc(75% - 4.5px)';
      case '100%':
      default: return '100%';
    }
  }
}
