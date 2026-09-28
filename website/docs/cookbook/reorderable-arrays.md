---
title: Reorderable arrays
---

# Build a reorderable array {#build-a-reorderable-array}

Use a stable domain identifier when server snapshots or drag-and-drop can reorder items:

```ts
const myForm = form({
  questions: array({
    id: field(''),
    label: field('', [required]),
    answer: field(''),
  }, {
    initialValue: [
      { id: 'name', label: 'Your name', answer: '' },
      { id: 'role', label: 'Your role', answer: '' },
      { id: 'team', label: 'Your team', answer: '' },
    ],
    trackBy: 'id',
  }),
});
```

Track each item node in Angular:

```html
@for (question of myForm.questions; track question; let index = $index) {
  <article>
    <input [formNode]="question.label" />
    <input [formNode]="question.answer" />

    <button type="button" (click)="myForm.questions.moveUp(index)">Move up</button>
    <button type="button" (click)="myForm.questions.moveDown(index)">Move down</button>
  </article>
}
```

For drag-and-drop code that already has source and destination indexes:

```ts
this.myForm.questions.move(previousIndex, currentIndex);
```

`move()`, `moveUp()`, `moveDown()`, and `swap()` preserve exact node identity, values, touched/dirty state, errors, and pending work. Paths update to the new indexes.

When a new server snapshot arrives, `set()` uses `trackBy` to reconcile the same identities:

```ts
this.myForm.questions.set(serverQuestions);
```

Use stable, unique keys so state follows each record across reordering. Duplicate keys are accepted
and matched by occurrence order within each key: each incoming entry gets a distinct node, and extra
current rows detach. A reconciliation with duplicate current or incoming keys warns once in Angular
development mode. Production uses the same matching without logging.

See [Dynamic arrays](../guides/dynamic-arrays.md).
