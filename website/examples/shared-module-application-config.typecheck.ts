import { bootstrapApplication } from '@angular/platform-browser';
import { Component, NgModule, type ApplicationConfig } from '@angular/core';
import { field, form, required, FormNode, ANGULAR_FORMS_STATUS_CLASSES, provideFormNodesConfig } from '@ngblocks/form-nodes';

// shared.module.ts
@NgModule({
  imports: [FormNode],
  exports: [FormNode],
})
export class SharedModule {}

// app.component.ts
@Component({
  selector: 'app-root',
  template: `
    <label>
      Name
      <input [formNode]="profile.name">
    </label>

    @if (profile.name.touched() && profile.name.hasError('required')) {
      <p>{{ profile.name.getError('required')?.message }}</p>
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

// app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    provideFormNodesConfig({
      validatorMessages: { required: 'Please enter your name.' },
      classes: ANGULAR_FORMS_STATUS_CLASSES,
    }),
  ],
};

// main.ts
bootstrapApplication(AppComponent, appConfig).catch(error => console.error(error));
