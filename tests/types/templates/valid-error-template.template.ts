import { Component } from '@angular/core';

import { field, FormNodeErrors } from '../../../src/public-api';

@Component({
  imports: [FormNodeErrors],
  template: `
    <form-node-errors [node]="name" [maxMessages]="2">
      <ng-template #message let-text let-messages="messages" let-errors="errors">
        <strong>{{ text }}</strong>
        @for (message of messages; track $index) { <span>{{ message }} {{ errors[$index].kind }}</span> }
      </ng-template>
    </form-node-errors>
  `,
})
export class ValidErrorTemplate {
  name = field('');
}
