import { Component, inject, OnInit, signal } from '@angular/core';
import { PageEvent, MatPaginatorModule } from '@angular/material/paginator';
import { CalcFormTO } from '../../model/form-field.model';
import { FormsService } from '../../services/forms.service';
import { FeedbackService } from '../../services/feedback.service';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router, RouterLink } from '@angular/router';
import { MatTableModule } from "@angular/material/table";
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-landing-forms-grid',
  templateUrl: './landing-forms-grid.component.html',
  styleUrl: './landing-forms-grid.component.scss',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatPaginatorModule,
    MatTableModule,
    MatButtonModule,
    MatProgressBarModule,
    MatTooltipModule,
    RouterLink,
]
})
export class LandingFormsGridComponent implements OnInit {

  private feedback = inject(FeedbackService);
  private service = inject(FormsService);

  protected readonly loading = signal(false);
  protected readonly filterText = signal('');
  protected readonly tableData = signal<CalcFormTO[]>([]);
  protected readonly total = signal(0);
  protected readonly tableParams = this.service.formsTableParams;
  private readonly router = inject(Router);

  constructor() {}

  ngOnInit(): void {
    this.filterText.set(this.tableParams().filter ?? '');
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);

    const p = this.tableParams();

    this.service.getTableForms({
      filter: p.filter ?? undefined,
      page: p.page,
      size: p.size,
      orderField: p.sort,
      inverse: p.inverse
    }).subscribe({
      next: (result) => {
        this.tableData.set(result.data);

        this.service.updateFormsTableParams({
          total: result.total
        });

        this.total.set(result.total);
        this.loading.set(false);
      },
      error: (err) => {
        this.feedback.notifyMessage({
          message: this.feedback.errorMessage(err, 'Error al cargar formularios.'),
          type: 'danger'
        });

        this.loading.set(false);
      }
    });
  }

  displayedColumns = [
    'name',
    'description',
    'calc',
    'url',
    'actions'
  ];

  search(): void {
    const trimmed = this.filterText().trim();

    this.service.updateFormsTableParams({
      filter: trimmed || null,
      page: 1
    });

    this.loadData();
  }

  getPublicUrl(formId: string): string {
    return `${window.location.origin}/preview-landing/${formId}`;
  }

  async copyUrl(formId: string): Promise<void> {
    const url = this.getPublicUrl(formId);
    try {
      await navigator.clipboard.writeText(url);
      this.feedback.notifyMessage({ message: 'URL copiada al portapapeles.', type: 'success' });
    } catch (error) {
      this.feedback.notifyMessage({
        message: this.feedback.errorMessage(error, 'No se pudo copiar la URL.'),
        type: 'danger'
      });
    }
  }

  delete(form: CalcFormTO): void {
    this.feedback.confirm(`¿Estás seguro de que querés eliminar el formulario "${form.name}"?`, () => {
      this.service.delete(form.oid).subscribe(() => {
        this.feedback.notifyMessage({ message: 'El formulario fue eliminado.', type: 'success' });
        this.loadData();
      }, error => {
        this.feedback.notifyMessage({
          message: this.feedback.errorMessage(error, 'No se pudo eliminar el formulario.'),
          type: 'danger'
        });
      });
    });
  }

  changePage(event: PageEvent): void {
    this.service.updateFormsTableParams({ page: event.pageIndex + 1, size: event.pageSize });
    this.loadData();
  }

  sort(field: keyof CalcFormTO): void {
    const p = this.tableParams();
    if (p.sort === field) {
      this.service.updateFormsTableParams({ inverse: !p.inverse });
    } else {
      this.service.updateFormsTableParams({ sort: field, inverse: false });
    }
    this.loadData();
  }

  navigateNew(): void {
    this.router.navigate(['/formulario', 'edit']);
  }

  navigateEdit(formId: string): void {
    this.router.navigate(['/formularios', 'edit', formId]);
  }

  navigateView(form: CalcFormTO): void {
    this.router.navigate(['/formularios', form.oid, 'view']);
  }

}
