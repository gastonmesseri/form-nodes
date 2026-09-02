import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { configureGlobalValidatorMessages } from '@gem/ng-forms';

import { validatorMessages } from './validator-message-catalog';

// main.ts: configure the shared fallback before bootstrapping the application.
configureGlobalValidatorMessages(validatorMessages);

@Component({
  selector: 'app-root',
  template: '',
})
class AppComponent {}

bootstrapApplication(AppComponent).catch(error => console.error(error));
