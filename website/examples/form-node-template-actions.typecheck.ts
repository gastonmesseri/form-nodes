import { Component } from '@angular/core';
import { field, form, required, FormNodeDirective } from '@ngblocks/form-nodes';

@Component({
  imports: [FormNodeDirective],
  template: `
    <label>
      Username
      <input #username="formNode" [formNode]="form.username" />
    </label>
    <button type="button" (click)="username.focus()">Focus</button>
    <button type="button" (click)="username.flush()">Apply pending edit</button>
    <button type="button" (click)="username.reset()">Clear interaction state</button>
    <p>Committed username: {{ username.node()() }}</p>
    @if (username.node().touched()) {
      @for (error of username.errors(); track $index) {
        <p>{{ error.message }}</p>
      }
    }
  `,
})
export class UsernameEditor {
  form = form({
    username: field('', [required], { debounce: 1000 }),
  });
}
