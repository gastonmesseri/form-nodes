import { Component } from '@angular/core';

import { field, form, FormNodeDirective } from '../../../src/public-api';

@Component({
  imports: [FormNodeDirective],
  template: '<input [(formNode)]="form.username" />',
})
class InvalidNodeTwoWayHost {
  form = form({ username: field('Ada') });
}
