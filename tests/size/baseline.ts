import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  selector: 'size-app',
  standalone: true,
  template: `<p>{{ name }}</p>`,
})
export class SizeApp {
  name = 'Marco';
}

bootstrapApplication(SizeApp).catch(console.error);
