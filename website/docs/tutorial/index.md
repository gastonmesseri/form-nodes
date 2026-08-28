---
title: Build a complete form
slug: /tutorial
description: A progressive Gem Forms tutorial from the first model to validation, arrays, and submission.
---

# Build a complete form

This tutorial builds a customer profile editor one capability at a time. Every step starts from working code and adds one concept, so you can stop at the level your application needs.

By the end, the form will include:

- A typed model owned by an Angular component.
- Native controls connected with `[formNode]`.
- Built-in validation and error rendering.
- Nested addresses and reactive state.
- A dynamic contacts array with stable identity.
- Cancelable asynchronous username validation.
- Native form submission and pending UI.

## Before you begin

Install the package in an Angular 22 application:

```bash
npm install --save @gem/ng-forms
```

The tutorial uses standalone components and Angular's built-in control flow. The form model itself does not require dependency injection.

## The progression

1. [Declare the model](./01-model.md)
2. [Bind native controls](./02-bind-controls.md)
3. [Add validation](./03-validation.md)
4. [Add nesting and reactive state](./04-nesting-and-state.md)
5. [Manage a dynamic array](./05-dynamic-arrays.md)
6. [Validate asynchronously](./06-async-validation.md)
7. [Submit the form](./07-submission.md)

Continue with [Step 1: Declare the model](./01-model.md).
