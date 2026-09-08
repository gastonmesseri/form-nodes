import { Component } from '@angular/core';
import { field, form, FormNodesModule } from '@ngblocks/form-nodes';

@Component({
  selector: 'app-profile-editor',
  imports: [FormNodesModule],
  template: `
    <form [formNode]="profile">
      <label>Name <input [formNode]="profile.name" /></label>
    </form>
  `,
})
export class ProfileEditorComponent {
  profile = form({ name: field('Marco') });
}
