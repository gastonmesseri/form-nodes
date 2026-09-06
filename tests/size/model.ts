import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

import { field, form } from '@ngblocks/form-nodes';

@Component({
  selector: 'size-app',
  standalone: true,
  template: `<p>{{ profile.name() }}</p>`,
})
export class SizeApp {
  profile = form({ name: field('Marco') });
}

bootstrapApplication(SizeApp).catch(console.error);
