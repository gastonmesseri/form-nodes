import { Component } from '@angular/core';
import { field, form, FormNodesModule } from '@ngblocks/form-nodes';

@Component({
  selector: 'app-profile-editor',
  imports: [FormNodesModule],
  template: `
    <form [formNode]="form">
      <label>Name <input [formNode]="form.name" /></label>
    </form>
  `,
})
export class ProfileEditorComponent {
  form = form({ name: field('Marco') });
}
