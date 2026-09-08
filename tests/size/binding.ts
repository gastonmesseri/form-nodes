import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { FormNodeDirective, field, form } from '@ngblocks/form-nodes';

@Component({
  selector: 'size-app',
  standalone: true,
  imports: [FormNodeDirective],
  template: `
    <form [formNode]="profile">
      <input [formNode]="profile.name">
      <p>{{ profile.name() }}</p>
    </form>
  `,
})
export class SizeApp {
  profile = form({ name: field('Marco') });
}

bootstrapApplication(SizeApp).catch(console.error);
