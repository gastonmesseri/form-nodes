import { Component, NgModule } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { field, form, required, FormNodeDirective, ANGULAR_FORMS_STATUS_CLASSES, provideFormNodesConfig } from '@ngblocks/form-nodes';

// shared.module.ts
@NgModule({
  imports: [FormNodeDirective],
  exports: [FormNodeDirective],
  providers: [
    provideFormNodesConfig({
      validatorMessages: { required: 'Please enter your name.' },
      classes: ANGULAR_FORMS_STATUS_CLASSES,
    }),
  ],
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

// main.ts
bootstrapApplication(AppComponent).catch(error => console.error(error));
