import { CdkDrag, CdkDragPreview, CdkDropList } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { FormField } from '../../model/form-field.model';

type ToolboxSection = {
  title: string;
  icon: string;
  fields: FormField[];
};

@Component({
  selector: 'app-toolbox',
  templateUrl: './toolbox.component.html',
  styleUrls: ['./toolbox.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CdkDrag,
    CdkDropList,
    CdkDragPreview,
    MatIcon,
  ]
})
export class ToolboxComponent {

  readonly toolboxSections = input<ToolboxSection[]>([]);
  readonly canvasListRef = input<string | CdkDropList<any> | null>(null);
  readonly noReturnPredicate = () => false;

}
