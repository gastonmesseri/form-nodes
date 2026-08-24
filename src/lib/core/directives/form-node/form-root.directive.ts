import { Directive, input } from '@angular/core';

import type { Form } from '../../primitives/form';

/** Binds a root `form()` node to a native `<form>` element. */
@Directive({
  selector: 'form[formNode]',
  standalone: true,
  host: {
    novalidate: '',
    '(submit)': 'submit($event)',
    '(reset)': 'reset($event)',
  },
})
export class FormRootDirective {
  /** Root form node submitted and reset by the host element. */
  form = input.required<Form<any>>({ alias: 'formNode' });

  /** Prevents native navigation and runs the form node's configured submission action. */
  submit(event: Event) {
    event.preventDefault();
    this.form().api.submit();
  }

  /** Resets the complete form tree instead of letting the browser reset only DOM controls. */
  reset(event: Event) {
    event.preventDefault();
    this.form().api.reset();
  }
}
