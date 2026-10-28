import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { environment } from '../environments/environment';
import { ThemeToggleComponent } from './components/theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet,ThemeToggleComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  protected readonly environment = environment;
}
