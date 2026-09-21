import { bootstrapApplication } from '@angular/platform-browser';
import { Component, NgModule, type ApplicationConfig } from '@angular/core';
import { field, form, required, FormNodeDirective, ANGULAR_FORMS_STATUS_CLASSES, provideFormNodesConfig } from '@ngblocks/form-nodes';

// shared.module.ts
@NgModule({
  imports: [FormNodeDirective],
  exports: [FormNodeDirective],
})
export class SharedModule {}

// app.component.ts
@Component({
  selector: 'app-root',
  template: `
    <label>
      Name
      <input [formNode]="form.name">
    </label>

    @if (form.name.touched() && form.name.hasError('required')) {
      <p>{{ form.name.getError('required')?.message }}</p>
    }

    <p>Current name: {{ form.name() }}</p>
  `,
  imports: [SharedModule],
  styles: ['input.ng-touched.ng-invalid { outline: 2px solid crimson; }'],
})
export class AppComponent {
  form = form({
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
