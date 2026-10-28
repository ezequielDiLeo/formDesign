import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormField, FormModel, PropertyConfig } from '../../model/form-field.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

@Component({
  selector: 'app-properties',
  templateUrl: './properties.component.html',
  styleUrls: ['./properties.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatSlideToggleModule
  ]
})
export class PropertiesComponent {

  @Input() selectedField: FormField | null = null;
  @Input() formModel!: FormModel;
  @Input() propertiesConfig: PropertyConfig[] = [];

  @Output() imageUploaded = new EventEmitter<any>();
  @Output() fieldUpdated = new EventEmitter<FormField>();
  @Output() formUpdated = new EventEmitter<FormModel>();

  getFirstOption(options?: any[]): any {
    if (!options || options.length === 0) return undefined;
    const first = options[0];
    return first.value !== undefined ? first.value : first;
  }

  updateField( key: string, value: any ) {
    if (!this.selectedField) {
      return;
    }
    const updated: FormField = {
      ...this.selectedField,
      [key]: value
    };

    this.fieldUpdated.emit(updated);
  }

  updateFormSetting( key: string, value: any)
    {
      this.formUpdated.emit({
        ...this.formModel,
        settings: {
          ...this.formModel.settings,
          [key]: value
        }
      });
    }
}
