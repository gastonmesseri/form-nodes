import { Component, signal } from '@angular/core';
import { FormNodeDirective } from '@ngblocks/form-nodes';

@Component({
  imports: [FormNodeDirective],
  template: `
    <label>
      Suggested name
      <input #control="formNode" [formNodeValue]="suggestedName()" />
    </label>
    <p>Edited name: {{ control.node()() }}</p>
  `,
})
export class SuggestedNameEditor {
  suggestedName = signal('Ada');
}
