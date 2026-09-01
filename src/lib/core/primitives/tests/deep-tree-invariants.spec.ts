import { describe, expect, it, vi } from 'vitest';

import { form } from '../form';
import { array } from '../array';
import { field } from '../field';
import { required } from '../../validation/validators/required';
import { asyncValidator } from '../../validation/async-validator';

const createDeepTree = () => form({
  teams: array(() => form({
    name: field.strict('', [required]),
    members: array(() => form({
      email: field.strict('', [required]),
    }), 1),
  }), 2),
});

/**
 * Structural contract tests for mixed form/array trees several levels deep.
 * These scenarios complement the primitive-specific suites by exercising complete root-to-leaf flows.
 */
describe('deep mixed form trees', () => {
  it('maintains parent, root form, and path navigation at every level', () => {
    const root = createDeepTree();
    const firstTeam = root.teams[0]!;
    const firstMember = firstTeam.members[0]!;
    const email = firstMember.email;

    expect(root.parent()).toBeNull();
    expect(root.form()).toBe(root);
    expect(root.path()).toEqual([]);
    expect(root.teams.parent()).toBe(root);
    expect(root.teams.path()).toEqual(['teams']);
    expect(firstTeam.parent()).toBe(root.teams);
    expect(firstTeam.path()).toEqual(['teams', '0']);
    expect(firstTeam.members.parent()).toBe(firstTeam);
    expect(firstTeam.members.path()).toEqual(['teams', '0', 'members']);
    expect(firstMember.parent()).toBe(firstTeam.members);
    expect(firstMember.path()).toEqual(['teams', '0', 'members', '0']);
    expect(email.parent()).toBe(firstMember);
    expect(email.path()).toEqual(['teams', '0', 'members', '0', 'email']);
    expect(email.form()).toBe(root);
  });

  it('propagates a deeply nested control update into every aggregate value and interaction state', () => {
    const root = createDeepTree();
    const team = root.teams[1]!;
    const member = team.members[0]!;

    team.name.setControlValue('Core');
    member.email.setControlValue('core@example.com');

    expect(member()).toEqual({ email: 'core@example.com' });
    expect(team()).toEqual({ name: 'Core', members: [{ email: 'core@example.com' }] });
    expect(root()).toEqual({
      teams: [
        { name: '', members: [{ email: '' }] },
        { name: 'Core', members: [{ email: 'core@example.com' }] },
      ],
    });
    expect(member.dirty()).toBe(true);
    expect(team.dirty()).toBe(true);
    expect(root.dirty()).toBe(true);
  });

  it('collects descendant errors in structural order with their exact target nodes', () => {
    const root = createDeepTree();
    const firstTeam = root.teams[0]!;
    const secondTeam = root.teams[1]!;

    expect(root.errors()).toEqual([]);
    expect(root.allErrors()).toEqual([
      expect.objectContaining({ kind: 'required', targetNode: firstTeam.name }),
      expect.objectContaining({ kind: 'required', targetNode: firstTeam.members[0]!.email }),
      expect.objectContaining({ kind: 'required', targetNode: secondTeam.name }),
      expect.objectContaining({ kind: 'required', targetNode: secondTeam.members[0]!.email }),
    ]);

    firstTeam.name.set('Core');
    firstTeam.members[0]!.email.set('core@example.com');

    expect(root.allErrors()).toEqual([
      expect.objectContaining({ kind: 'required', targetNode: secondTeam.name }),
      expect.objectContaining({ kind: 'required', targetNode: secondTeam.members[0]!.email }),
    ]);
  });

  it('propagates inherited availability state to the deepest leaf and restores stored state', () => {
    const root = createDeepTree();
    const email = root.teams[0]!.members[0]!.email;
    email.markAsDirty();
    email.markAsTouched();

    root.disable();
    expect(email.disabled()).toBe(true);
    expect(email.dirty()).toBe(false);
    expect(email.touched()).toBe(false);
    expect(root.valid()).toBe(true);

    root.enable();
    root.markAsReadonly();
    expect(email.readonly()).toBe(true);
    expect(root.valid()).toBe(true);

    root.markAsWritable();
    root.hide();
    expect(email.hidden()).toBe(true);
    expect(root.valid()).toBe(true);

    root.show();
    expect(email.disabled()).toBe(false);
    expect(email.readonly()).toBe(false);
    expect(email.hidden()).toBe(false);
    expect(email.dirty()).toBe(true);
    expect(email.touched()).toBe(true);
    expect(root.invalid()).toBe(true);
  });

  it('resets interaction state recursively while preserving the complete current value', () => {
    const root = createDeepTree();
    const email = root.teams[0]!.members[0]!.email;
    root.teams[0]!.name.set('Core');
    email.set('core@example.com');
    root.markAsTouched();
    email.markAsDirty();
    const currentValue = root();

    root.reset();

    expect(root()).toEqual(currentValue);
    expect(root.touched()).toBe(false);
    expect(root.dirty()).toBe(false);
    expect(root.teams[0]!.touched()).toBe(false);
    expect(root.teams[0]!.members[0]!.touched()).toBe(false);
    expect(email.touched()).toBe(false);
    expect(email.dirty()).toBe(false);
  });

  it('flushes a deeply inherited control debounce from the root', () => {
    vi.useFakeTimers();
    try {
      const root = form({
        groups: array(() => form({
          members: array(() => form({
            name: field.strict('David'),
          }), 1),
        }), 1),
      }, { debounce: 100 });
      const name = root.groups[0]!.members[0]!.name;

      name.setControlValue('Mark');
      expect(name()).toBe('David');
      expect(name.controlValue()).toBe('Mark');
      expect(root.debouncing()).toBe(true);

      root.flush();

      expect(name()).toBe('Mark');
      expect(root()).toEqual({ groups: [{ members: [{ name: 'Mark' }] }] });
      expect(root.debouncing()).toBe(false);
      vi.runAllTimers();
      expect(name()).toBe('Mark');
    } finally {
      vi.useRealTimers();
    }
  });

  it('preserves node identity and updates every descendant path after nested moves', () => {
    const root = createDeepTree();
    const movedTeam = root.teams[1]!;
    const movedMember = movedTeam.members[0]!;
    const movedEmail = movedMember.email;
    movedTeam.members.push({ email: 'second@example.com' });
    const secondMember = movedTeam.members[1]!;

    movedTeam.members.move(1, 0);
    root.teams.move(1, 0);

    expect(root.teams[0]).toBe(movedTeam);
    expect(movedTeam.path()).toEqual(['teams', '0']);
    expect(movedTeam.members[0]).toBe(secondMember);
    expect(secondMember.path()).toEqual(['teams', '0', 'members', '0']);
    expect(movedMember.path()).toEqual(['teams', '0', 'members', '1']);
    expect(movedEmail.path()).toEqual(['teams', '0', 'members', '1', 'email']);
    expect(movedEmail.form()).toBe(root);
  });

  it('detaches a removed subtree while keeping it independently usable', () => {
    const root = createDeepTree();
    const removed = root.teams.removeAt(0)!;
    const removedMember = removed.members[0]!;
    const removedEmail = removedMember.email;

    expect(removed.parent()).toBeNull();
    expect(removed.path()).toEqual([]);
    expect(removed.form()).toBe(removed);
    expect(removed.members.parent()).toBe(removed);
    expect(removedMember.path()).toEqual(['members', '0']);
    expect(removedEmail.path()).toEqual(['members', '0', 'email']);
    expect(removedEmail.form()).toBe(removed);
    expect(root.teams[0]!.path()).toEqual(['teams', '0']);

    removedEmail.set('detached@example.com');
    expect(removed()).toEqual({ name: '', members: [{ email: 'detached@example.com' }] });
    expect(root()).toEqual({ teams: [{ name: '', members: [{ email: '' }] }] });
  });

  it('stops aggregating pending validation and late errors from a directly removed subtree', async () => {
    let resolve!: (result: { kind: string }) => void;
    const root = form({
      groups: array(() => form({
        members: array(() => form({
          name: field.strict('David', [
            asyncValidator(() => new Promise<{ kind: string }>((done) => { resolve = done; })),
          ]),
        }), 1),
      }), 1),
    });
    expect(root.pending()).toBe(true);
    await Promise.resolve();

    const removed = root.groups.removeAt(0)!;
    const removedName = removed.members[0]!.name;

    expect(root.pending()).toBe(false);
    expect(root.valid()).toBe(true);
    expect(removed.pending()).toBe(true);

    resolve({ kind: 'detachedError' });
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(removedName.getError('detachedError')?.targetNode).toBe(removedName);
    expect(removed.invalid()).toBe(true);
    expect(root.valid()).toBe(true);
    expect(root.allErrors()).toEqual([]);
  });
});
