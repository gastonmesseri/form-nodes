import CodeBlock from '@theme/CodeBlock';
import { useEffect, useRef, useState, type ChangeEvent } from 'react';

import { form } from '../../../src/lib/primitives/form';
import { field } from '../../../src/lib/primitives/field';
import { array } from '../../../src/lib/primitives/array';
import { email } from '../../../src/lib/validation/validators/email';
import { required } from '../../../src/lib/validation/validators/required';
import { minLength } from '../../../src/lib/validation/validators/min-length';

const playgroundDeclaration = `const playgroundForm = form({
  displayName: field('', [required, minLength(3)], {
    debounce: 300,
  }),
  email: field('', [required, email]),
  contacts: array({
    id: field.strict(''),
    label: field(''),
    email: field('', [email]),
  }, {
    initialValue: [
      { id: 'contact-1', label: 'Work', email: 'ada@example.com' },
    ],
    trackBy: 'id',
  }),
});`;

const createPlaygroundForm = () => {
  return form({
    displayName: field('', [required, minLength(3)], {
      debounce: 300,
    }),
    email: field('', [required, email]),
    contacts: array({
      id: field.strict(''),
      label: field(''),
      email: field('', [email]),
    }, {
      initialValue: [
        { id: 'contact-1', label: 'Work', email: 'ada@example.com' },
      ],
      trackBy: 'id',
    }),
  });
};

type PlaygroundForm = ReturnType<typeof createPlaygroundForm>;
type PlaygroundErrorTarget = ReturnType<PlaygroundForm['allErrors']>[number]['targetNode'];

const readErrorMessages = (node: PlaygroundForm['displayName'] | PlaygroundForm['email']) => {
  return node.errors().map(error => error.message);
};

export default function FormsPlayground() {
  const formRef = useRef<PlaygroundForm | null>(null);
  const nextContactId = useRef(2);
  const scheduledRefreshes = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());
  const [, setRevision] = useState(0);

  if (formRef.current === null) formRef.current = createPlaygroundForm();
  const playgroundForm = formRef.current;

  const refresh = () => {
    setRevision(value => {
      return value + 1;
    });
  };

  const refreshAfterDebounce = () => {
    const timeout = setTimeout(() => {
      scheduledRefreshes.current.delete(timeout);
      refresh();
    }, 325);
    scheduledRefreshes.current.add(timeout);
  };

  useEffect(() => {
    const refreshes = scheduledRefreshes.current;
    return () => {
      refreshes.forEach(timeout => clearTimeout(timeout));
      refreshes.clear();
    };
  }, []);

  const updateDisplayName = (event: ChangeEvent<HTMLInputElement>) => {
    playgroundForm.displayName.setControlValue(event.currentTarget.value);
    refresh();
    refreshAfterDebounce();
  };

  const updateEmail = (event: ChangeEvent<HTMLInputElement>) => {
    playgroundForm.email.setControlValue(event.currentTarget.value);
    refresh();
  };

  const flushName = () => {
    playgroundForm.displayName.flush();
    refresh();
  };

  const toggleDisabled = () => {
    if (playgroundForm.displayName.disabled()) playgroundForm.displayName.enable();
    else playgroundForm.displayName.disable('Disabled from the playground.');
    refresh();
  };

  const markTouched = () => {
    playgroundForm.markAsTouched();
    refresh();
  };

  const touchDisplayName = () => {
    playgroundForm.displayName.markAsTouched();
    refresh();
  };

  const touchEmail = () => {
    playgroundForm.email.markAsTouched();
    refresh();
  };

  const addContact = () => {
    const id = nextContactId.current;
    nextContactId.current += 1;
    playgroundForm.contacts.push({
      id: `contact-${id}`,
      label: `Contact ${id}`,
      email: '',
    });
    refresh();
  };

  const resetPlayground = () => {
    playgroundForm.reset({
      displayName: '',
      email: '',
      contacts: [
        { id: 'contact-1', label: 'Work', email: 'ada@example.com' },
      ],
    });
    nextContactId.current = 2;
    refresh();
  };

  const displayNameErrors = readErrorMessages(playgroundForm.displayName);
  const emailErrors = readErrorMessages(playgroundForm.email);
  const activityMessage = playgroundForm.displayName.disabled()
    ? 'The displayName node is disabled, so it is excluded from validation.'
    : playgroundForm.displayName.debouncing()
      ? 'The control value changed immediately. The committed value will update after 300 ms.'
      : playgroundForm.allErrors().length > 0
        ? 'The current committed value is invalid. Touch fields to reveal their messages.'
        : 'The committed form value is valid and synchronized with the controls.';
  const errorPath = (targetNode: PlaygroundErrorTarget) => {
    if (targetNode === playgroundForm) return '(root)';
    if (targetNode === playgroundForm.displayName) return 'displayName';
    if (targetNode === playgroundForm.email) return 'email';

    for (const [index, contact] of playgroundForm.contacts.items().entries()) {
      if (targetNode === contact) return `contacts.${index}`;
      if (targetNode === contact.id) return `contacts.${index}.id`;
      if (targetNode === contact.label) return `contacts.${index}.label`;
      if (targetNode === contact.email) return `contacts.${index}.email`;
    }

    return 'contacts';
  };
  const visibleErrors = playgroundForm.allErrors().map(error => {
    return {
      kind: error.kind,
      message: error.message,
      path: errorPath(error.targetNode),
    };
  });

  return (
    <div className="forms-playground">
      <section className="forms-playground__model" aria-label="Form model declaration">
        <div className="forms-playground__model-copy">
          <span className="forms-playground__eyebrow">The model running below</span>
          <h2>A real Form Nodes declaration</h2>
          <p>
            The editor, state inspector, and JSON value all use this exact node tree. Change a
            control below and compare its immediate control value with the committed form value.
          </p>
        </div>
        <CodeBlock language="ts" title="playground-form.ts">{playgroundDeclaration}</CodeBlock>
        <div className="forms-playground__flow" aria-label="Value flow">
          <span><strong>1</strong> Control event</span>
          <span aria-hidden="true">→</span>
          <span><strong>2</strong> <code>controlValue()</code></span>
          <span aria-hidden="true">→</span>
          <span><strong>3</strong> Debounce</span>
          <span aria-hidden="true">→</span>
          <span><strong>4</strong> <code>playgroundForm()</code></span>
        </div>
      </section>

      <section className="forms-playground__editor" aria-label="Interactive form controls">
        <div className="forms-playground__heading">
          <div>
            <span className="forms-playground__eyebrow">Live model</span>
            <h2>Edit the form</h2>
          </div>
          <button className="button button--secondary button--sm" type="button" onClick={resetPlayground}>
            Reset playground
          </button>
        </div>

        <label className="forms-playground__field">
          <span>Display name</span>
          <input
            value={playgroundForm.displayName.controlValue() ?? ''}
            disabled={playgroundForm.displayName.disabled()}
            onBlur={touchDisplayName}
            onChange={updateDisplayName}
          />
          <small>Uses a 300 ms control-value debounce and a minimum length of 3.</small>
        </label>
        {playgroundForm.displayName.touched() && displayNameErrors.length > 0 && (
          <ul className="forms-playground__errors">
            {displayNameErrors.map(message => <li key={message}>{message}</li>)}
          </ul>
        )}

        <label className="forms-playground__field">
          <span>Email</span>
          <input
            type="email"
            value={playgroundForm.email.controlValue() ?? ''}
            onBlur={touchEmail}
            onChange={updateEmail}
          />
          <small>Required and validated with the built-in email validator.</small>
        </label>
        {playgroundForm.email.touched() && emailErrors.length > 0 && (
          <ul className="forms-playground__errors">
            {emailErrors.map(message => <li key={message}>{message}</li>)}
          </ul>
        )}

        <div className="forms-playground__actions">
          <button className="button button--primary button--sm" type="button" onClick={flushName}>
            Flush name
          </button>
          <button className="button button--secondary button--sm" type="button" onClick={markTouched}>
            Mark all touched
          </button>
          <button className="button button--secondary button--sm" type="button" onClick={toggleDisabled}>
            {playgroundForm.displayName.disabled() ? 'Enable name' : 'Disable name'}
          </button>
        </div>

        <div className="forms-playground__array-heading">
          <div>
            <span className="forms-playground__eyebrow">Dynamic array</span>
            <h3>Contacts</h3>
          </div>
          <button className="button button--primary button--sm" type="button" onClick={addContact}>
            Add contact
          </button>
        </div>

        <div className="forms-playground__contacts">
          {playgroundForm.contacts.items().map((contact, index) => (
            <article className="forms-playground__contact" key={contact.id()}>
              <div className="forms-playground__contact-fields">
                <label>
                  <span>Label</span>
                  <input value={contact.label() ?? ''} onChange={event => {
                    contact.label.setControlValue(event.currentTarget.value);
                    refresh();
                  }} />
                </label>
                <label>
                  <span>Email</span>
                  <input type="email" value={contact.email() ?? ''} onChange={event => {
                    contact.email.setControlValue(event.currentTarget.value);
                    refresh();
                  }} />
                </label>
                <code>{contact.path().join('.')} · tracked by {contact.id()}</code>
              </div>
              <div className="forms-playground__row-actions">
                <button type="button" aria-label={`Move ${contact.label()} up`} disabled={index === 0} onClick={() => {
                  playgroundForm.contacts.moveUp(index);
                  refresh();
                }}>↑</button>
                <button type="button" aria-label={`Move ${contact.label()} down`} disabled={index === playgroundForm.contacts.length() - 1} onClick={() => {
                  playgroundForm.contacts.moveDown(index);
                  refresh();
                }}>↓</button>
                <button type="button" aria-label={`Remove ${contact.label()}`} onClick={() => {
                  playgroundForm.contacts.removeAt(index);
                  refresh();
                }}>×</button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <aside className="forms-playground__inspector" aria-label="Live form state">
        <span className="forms-playground__eyebrow">Signal inspector</span>
        <h2>Current state</h2>

        <p className="forms-playground__activity" data-active={playgroundForm.displayName.debouncing()}>
          {activityMessage}
        </p>

        <dl className="forms-playground__state-grid">
          <div><dt>Status</dt><dd data-state={playgroundForm.validationStatus()}>{playgroundForm.validationStatus()}</dd></div>
          <div><dt>Dirty</dt><dd>{String(playgroundForm.dirty())}</dd></div>
          <div><dt>Touched</dt><dd>{String(playgroundForm.touched())}</dd></div>
          <div><dt>Debouncing</dt><dd>{String(playgroundForm.debouncing())}</dd></div>
          <div><dt>Errors</dt><dd>{playgroundForm.allErrors().length}</dd></div>
          <div><dt>Contacts</dt><dd>{playgroundForm.contacts.length()}</dd></div>
        </dl>

        <h3><code>playgroundForm()</code> · committed value</h3>
        <pre><code>{JSON.stringify(playgroundForm(), null, 2)}</code></pre>

        <h3><code>displayName.controlValue()</code> · immediate</h3>
        <pre><code>{JSON.stringify(playgroundForm.displayName.controlValue())}</code></pre>

        <h3><code>allErrors()</code> · simplified</h3>
        <pre><code>{JSON.stringify(visibleErrors, null, 2)}</code></pre>

        <h3><code>displayName.disabledReasons()</code></h3>
        <pre><code>{JSON.stringify(playgroundForm.displayName.disabledReasons().map(reason => reason.message), null, 2)}</code></pre>
      </aside>
    </div>
  );
}
