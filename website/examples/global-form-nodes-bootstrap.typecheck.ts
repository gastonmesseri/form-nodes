// Imports shared by the combined example.
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { field, form, required, FormNode, ANGULAR_FORMS_STATUS_CLASSES, configureGlobalFormNodes } from '@ngblocks/form-nodes';
import { validatorMessages } from './validator-message-catalog';

// app.component.ts
@Component({
  selector: 'app-root',
  template: `
    <label>Name <input [formNode]="profile.name"></label>
    @if (profile.name.touched()) {
      <p>{{ profile.name.getError('required')?.message }}</p>
    }
  `,
  imports: [FormNode],
})
class AppComponent {
  profile = form({ name: field('', [required]) });
}

// main.ts
configureGlobalFormNodes({
  validatorMessages,
  classes: ANGULAR_FORMS_STATUS_CLASSES,
  syncInputs: true,
});

bootstrapApplication(AppComponent).catch(error => console.error(error));
