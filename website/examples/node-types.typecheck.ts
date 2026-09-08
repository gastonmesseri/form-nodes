import { Component, input } from '@angular/core';
import { array, field, form, group, type AnyNode, type FieldNode, type FormNode, type GroupNode, type ArrayNode } from '@ngblocks/form-nodes';

@Component({
  selector: 'app-node-status',
  template: `<span>{{ node().$api.validationStatus() }}</span>`,
})
export class NodeStatusComponent {
  node = input.required<AnyNode>();
}

@Component({
  selector: 'app-node-tools',
  template: `
    <button (click)="field().markAsTouched()">Touch field</button>
    <button (click)="group().$api.markAsTouched()">Touch group</button>
    <button (click)="form().$api.submit()">Submit form</button>
    <button (click)="array().push()">Add item</button>
  `,
})
export class NodeToolsComponent {
  field = input.required<FieldNode>();
  group = input.required<GroupNode>();
  form = input.required<FormNode>();
  array = input.required<ArrayNode>();
}

@Component({
  selector: 'app-profile',
  imports: [NodeStatusComponent, NodeToolsComponent],
  template: `
    <app-node-status [node]="profile" />
    <app-node-tools
      [field]="profile.name"
      [group]="profile.preferences"
      [form]="profile"
      [array]="profile.contacts"
    />
  `,
})
export class ProfileComponent {
  profile = form({
    name: field('Marco'),
    preferences: group({ newsletter: field(true) }),
    contacts: array({ email: field('') }),
  });
}
