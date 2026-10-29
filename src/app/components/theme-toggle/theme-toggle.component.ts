import { Component, OnInit, signal } from '@angular/core';

@Component({
  selector: 'app-theme-toggle',
  imports: [],
  templateUrl: './theme-toggle.component.html',
  styleUrl: './theme-toggle.component.scss'
})
export class ThemeToggleComponent implements OnInit {
  isDark = signal(false);

  ngOnInit(): void {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia(
      '(prefers-color-scheme: dark)'
    ).matches;

    const shouldBeDark = savedTheme
      ? savedTheme === 'dark'
      : prefersDark;

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
    document.documentElement.classList.toggle(
      'mc-dark-theme',
      isDark
    );

    document.body.classList.toggle('mc-dark-theme', isDark);

    document.body.setAttribute(
      'data-theme',
      isDark ? 'mc-dark' : 'light'
    );
  }
}
