import { NgModule } from '@angular/core';

import { FormNodeDirective } from './form-node/form-node.directive';

/**
 * Imports and re-exports the Angular template features provided by Form Nodes.
 * Currently includes `FormNodeDirective`. It does not configure providers or global defaults.
 * Standalone components may import either this module or individual directives.
 *
 * ```ts
 * import { Component } from '@angular/core';
 *
 * @Component({
 *   imports: [FormNodesModule],
 *   template: `<input
 *     [formNode]="form.name"
 *   />`,
 * })
 * export class ProfileComponent {
 *   form = form({ name: field('Marco') });
 * }
 * ```
 */
@NgModule({
  imports: [FormNodeDirective],
  exports: [FormNodeDirective],
})
export class FormNodesModule {}
