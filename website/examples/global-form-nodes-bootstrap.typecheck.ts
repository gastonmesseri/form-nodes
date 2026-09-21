// Imports shared by the combined example.
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { field, form, required, FormNodeDirective, ANGULAR_FORMS_STATUS_CLASSES, configureGlobalFormNodes } from '@ngblocks/form-nodes';
import { validatorMessages } from './validator-message-catalog';

// app.component.ts
@Component({
  selector: 'app-root',
  template: `
    <label>Name <input [formNode]="form.name"></label>
    @if (form.name.touched()) {
      <p>{{ form.name.getError('required')?.message }}</p>
    }
  `,
  imports: [FormNodeDirective],
})
class AppComponent {
  form = form({ name: field('', [required]) });
}

// main.ts
configureGlobalFormNodes({
  validatorMessages,
  classes: ANGULAR_FORMS_STATUS_CLASSES,
  syncInputs: 'declared',
});

bootstrapApplication(AppComponent).catch(error => console.error(error));
