(() => {
  const stored = localStorage.getItem('app_theme');
  const dark = stored === 'mc-dark';
  const body = document.body;
  body.setAttribute('data-theme', dark ? 'mc-dark' : 'mc-light');
  body.classList.remove(dark ? 'mc-light-theme' : 'mc-dark-theme');
  body.classList.add(dark ? 'mc-dark-theme' : 'mc-light-theme');
})();

import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
