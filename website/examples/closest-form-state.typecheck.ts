import { Component } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { field, form, FormNodeDirective, useClosestFormState } from '@ngblocks/form-nodes';

// submission-status.component.ts
@Component({
  selector: 'app-submission-status',
  template: `
    @if (formState.submitted()) {
      <p>Please review any errors before continuing.</p>
    }
    @if (formState.formNode(); as node) {
      <button type="button" (click)="node.reset()">Reset Form Nodes form</button>
    }
  `,
})
export class SubmissionStatus {
  formState = useClosestFormState();
}

// checkout.component.ts
@Component({
  imports: [FormNodeDirective, FormsModule, ReactiveFormsModule, SubmissionStatus],
  template: `
    <form [formNode]="checkout">
      <input [formNode]="checkout.name" />
      <app-submission-status />
      <button type="submit">Save</button>
    </form>

    <form [formGroup]="legacyCheckout">
      <input formControlName="name" />
      <app-submission-status />
      <button type="submit">Save</button>
      <button type="reset">Reset</button>
    </form>

    <form>
      <input name="name" [(ngModel)]="name" />
      <app-submission-status />
      <button type="submit">Save</button>
      <button type="reset">Reset</button>
    </form>
  `,
})
export class Checkout {
  checkout = form({ name: field('') });
  legacyCheckout = new FormGroup({ name: new FormControl('') });
  name = '';
}
