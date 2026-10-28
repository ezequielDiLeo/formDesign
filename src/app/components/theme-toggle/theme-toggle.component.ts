import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-theme-toggle',
  imports: [],
  templateUrl: './theme-toggle.component.html',
  styleUrl: './theme-toggle.component.scss'
})

export class ThemeToggleComponent {
isDark = signal(false);

  ngOnInit(): void {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = savedTheme ? savedTheme === 'dark' : prefersDark;

    this.isDark.set(shouldBeDark);
    this.applyTheme(shouldBeDark);
  }

  toggleTheme(): void {
    const nextState = !this.isDark();
    this.isDark.set(nextState);
    this.applyTheme(nextState);
    localStorage.setItem('theme', nextState ? 'dark' : 'light');
  }

  private applyTheme(isDark: boolean): void {
    if (isDark) {
      document.body.classList.add('mc-dark-theme');
      document.body.setAttribute('data-theme', 'mc-dark');
    } else {
      document.body.classList.remove('mc-dark-theme');
      document.body.removeAttribute('data-theme');
    }
  }
}
