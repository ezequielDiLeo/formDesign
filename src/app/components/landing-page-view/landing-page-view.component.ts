import { Component, OnInit, inject, signal } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { FormsService } from '../../services/forms.service';
import { FeedbackService } from '../../services/feedback.service';
import { CalcFormTO } from '../../model/form-field.model';

@Component({
  selector: 'app-landing-page-view',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
  ],
  templateUrl: './landing-page-view.component.html',
  styleUrl: './landing-page-view.component.scss',
})
export class LandingPageViewComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);
  private readonly service = inject(FormsService);
  private readonly feedback = inject(FeedbackService);

  protected readonly form = signal<CalcFormTO | null>(null);
  protected readonly calcLabel = signal<string | null>(null);
  protected readonly loading = signal(false);

  ngOnInit(): void {
    const oid = this.route.snapshot.paramMap.get('id') ?? '';
    this.loading.set(true);
    this.service.getById(oid).subscribe({
      next: (data: any) => {
        this.form.set(data);
        // calcName is resolved server-side (CalcFormTOT.resolveCalcName); it currently returns
        // the group string itself, group is kept only as a fallback.
        this.calcLabel.set(data?.calcName ?? data?.group ?? null);
        this.loading.set(false);
      },
      error: (err: any) => {
        this.feedback.notifyMessage({
          message: this.feedback.errorMessage(err, 'No se pudo cargar el formulario.'),
          type: 'danger'
        });
        this.loading.set(false);
      },
    });
  }

  back(): void {
    this.location.back();
  }
}
