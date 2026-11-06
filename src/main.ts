(() => {
  const storedTheme = localStorage.getItem('app_theme');
  const legacyTheme = localStorage.getItem('theme');
  const dark = storedTheme
    ? storedTheme === 'mc-dark'
    : legacyTheme
      ? legacyTheme === 'dark'
      : window.matchMedia('(prefers-color-scheme: dark)').matches;
  const body = document.body;
  const theme = dark ? 'mc-dark' : 'mc-light';

  localStorage.setItem('app_theme', theme);
  body.setAttribute('data-theme', theme);
  body.classList.toggle('mc-dark-theme', dark);
  body.classList.toggle('mc-light-theme', !dark);
})();

import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
