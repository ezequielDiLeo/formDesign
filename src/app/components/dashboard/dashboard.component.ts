import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { FeedbackService } from '../../services/feedback.service';
import { FormsDashboardOverview, FormsService } from '../../services/forms.service';
import { ThemeToggleComponent } from '../theme-toggle/theme-toggle.component';

const EMPTY_OVERVIEW: FormsDashboardOverview = {
  totalForms: 0,
  calculationCount: 0,
  updatedThisMonth: 0,
  recentForms: []
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, RouterLink, ThemeToggleComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  private readonly formsService = inject(FormsService);
  private readonly feedback = inject(FeedbackService);

  protected readonly loading = signal(true);
  protected readonly overview = signal<FormsDashboardOverview>(EMPTY_OVERVIEW);

  ngOnInit(): void {
    this.loadOverview();
  }

  loadOverview(): void {
    this.loading.set(true);

    this.formsService.getDashboardOverview().subscribe({
      next: overview => {
        this.overview.set(overview);
        this.loading.set(false);
      },
      error: error => {
        this.feedback.notifyMessage({
          message: this.feedback.errorMessage(error, 'No se pudo cargar el dashboard.'),
          type: 'danger'
        });
        this.loading.set(false);
      }
    });
  }
}
