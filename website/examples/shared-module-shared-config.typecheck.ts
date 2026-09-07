import { Component, NgModule } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

import { field, form, required, FormNode, ANGULAR_FORMS_STATUS_CLASSES, provideFormNodeConfig } from '@ngblocks/form-nodes';

@NgModule({
  imports: [FormNode],
  exports: [FormNode],
  providers: [
    provideFormNodeConfig({
      classes: ANGULAR_FORMS_STATUS_CLASSES,
    }),
  ],
})
export class SharedModule {}

@Component({
  selector: 'app-root',
  template: `
    <label>
      Name
      <input [formNode]="profile.name">
    </label>

    @if (profile.name.touched() && profile.name.hasError('required')) {
      <p>Name is required.</p>
    }

    <p>Current name: {{ profile.name() }}</p>
  `,
  imports: [SharedModule],
  styles: ['input.ng-touched.ng-invalid { outline: 2px solid crimson; }'],
})
export class AppComponent {
  profile = form({
    name: field('', [required]),
  });
}

bootstrapApplication(AppComponent).catch(error => console.error(error));
