import { Component, viewChild, type Signal, type WritableSignal } from '@angular/core';

import { FormNodesModule, FormNodeDirective, FormNodeErrors, useClosestFormState, array, createFormPrimitives, field, form, group, required, greaterThan, lessThan, lengthBetween, isFormNode, provideFormNodesConfig, configureGlobalFormNodes, type FormNodeValue, type FieldNode, type GroupNode, type FormNode, type ArrayNode, type ArrayItemNode } from '@ngblocks/form-nodes';

const configuredForms = createFormPrimitives({ nullable: false });

const candidate: unknown = configuredForms.field('Marco');
if (!isFormNode(candidate) || candidate() !== 'Marco' || isFormNode({})) {
  throw new Error('The package must export a working node type guard.');
}

const strictAmount = field(1, [greaterThan(1), lessThan(2)]);
if (strictAmount.getError('greaterThan')?.limit !== 1 || strictAmount.getError('lessThan')) {
  throw new Error('The package must export strict numeric validators.');
}

class Company {
  constructor(readonly name: string) {}
}

@Component({
  selector: 'package-consumer',
  standalone: true,
  imports: [FormNodesModule, FormNodeErrors],
  providers: [provideFormNodesConfig({ syncInputs: false })],
  template: `
    <form [formNode]="profile" (formNodeSubmit)="$event.form.$api.submitted()" (formNodeSubmitBlocked)="$event.event.preventDefault()">
      <span>{{ profile.submitted() }}</span>
      @if (closestForm(); as closest) { <span>{{ closest.submitted() }}</span> }
      <input #nameBinding="formNode" [formNode]="profile.name"
        (formNodeChange)="$event.toUpperCase()" (formNodeValueChange)="$event.toUpperCase()">
      <form-node-errors [node]="profile.name">
        <ng-template #message let-message let-messages="messages">
          {{ message }} ({{ messages.length }})
        </ng-template>
      </form-node-errors>
      <input [formNode]="dynamicAge">
      @for (address of profile.addresses; track address) {
        <input [formNode]="address.city">
      }
    </form>
  `,
})
export class PackageConsumer {
  closestForm = useClosestFormState().formNode;
  readonly nullableOverride: string | null = configuredForms.field.nullable('Marco')();
  readonly nonNullableOverride: string = field.strict('Marco')();
  readonly configuredProfile = configuredForms.form({ name: configuredForms.field(''), city: '' });
  readonly configuredName: string = this.configuredProfile.name();
  readonly configuredCity: string = this.configuredProfile.city();
  readonly profile = form({
    name: field('Marco', [required]),
    preferences: group({ theme: field('dark') }),
    addresses: array({ city: field('Zurich') }, [{ city: 'Madrid' }]),
    shorthandAddresses: array({ city: '', postcode: 0 }, [{ city: 'Bern', postcode: 3000 }]),
    roles: ['admin'],
    birthday: new Date('1990-06-15T00:00:00.000Z'),
    company: new Company('Form Nodes'),
    atomicAddress: field({ city: 'Bern' }),
  });

  genericField: FieldNode = this.profile.name;

  genericGroup: GroupNode = this.profile.preferences;

  genericForm: FormNode = this.profile;

  genericArray: ArrayNode = this.profile.addresses;

  readonly profileValue: FormNodeValue<PackageConsumer['profile']> = this.profile();

  readonly name: string | null = this.profileValue.name;
  readonly city: FormNodeValue<NonNullable<PackageConsumer['profile']['addresses'][number]>['city']> = this.profile.addresses[0]!.city();

  readonly addressValues: FormNodeValue<PackageConsumer['profile']['addresses']> = this.profile.addresses();

  readonly preferenceValue: FormNodeValue<PackageConsumer['profile']['preferences']> = this.profile.preferences();

  readonly theme: string | null = this.profile.preferences.theme();
  readonly shorthandCity: string | null = this.profile.shorthandAddresses[0]!.city();
  readonly shorthandPostcode: number | null = this.profile.shorthandAddresses[0]!.postcode();
  readonly roles: string[] | null = this.profile.roles();
  readonly birthday: Date | null = this.profile.birthday();
  readonly company: Company | null = this.profile.company();
  readonly atomicAddress: { city: string } | null = this.profile.atomicAddress();
  readonly dynamicAge = this.profile.add('age', 36);
  readonly dynamic = this.profile.add({ nickname: '', location: { city: 'Zurich' } });
  readonly dynamicAgeValue: number | null = this.dynamicAge();
  readonly dynamicNickname: string | null = this.dynamic.nickname();
  readonly dynamicCity: string | null = this.dynamic.location.city();
  readonly nameBinding = viewChild.required<FormNodeDirective<typeof this.profile.name>>('nameBinding');

  focusName() {
    this.nameBinding().focus();
    this.nameBinding().errors();
  }
}

const restoreGlobal = configureGlobalFormNodes({ classes: null, syncInputs: 'declared' });
restoreGlobal();


const configuredRows = array(group({ count: field(0), label: field('') }, {
  configure: ({ children }) => {
    children.label.setValidators(() => {
      const count: number | null = children.count();
      return count === null ? { kind: 'missingCount' } : null;
    });
  },
}), {
  configure: ({ items }) => {
    const count: number | null | undefined = items()[0]?.count();
    void count;
  },
});
type ConfiguredRow = ArrayItemNode<typeof configuredRows>;
const configuredRow: ConfiguredRow = configuredRows.push();
configuredRow.label.setValidators((ctx) => {
  const parent = ctx.parent<ConfiguredRow>();
  const count: number | null | undefined = parent?.count();
  return count === null ? { kind: 'missingCount' } : null;
});

const lengthLimited = field('Ada', [lengthBetween(1, 5)]);
lengthLimited.set('Longer');
const lengthFailure = lengthLimited.getError('maxLength');
if (lengthFailure?.maxLength !== 5 || lengthFailure.actual !== 6) {
  throw new Error('The package must export lengthBetween with typed length errors.');
}


// Public declarations must satisfy Angular's writable contract without consumer assertions.
const writableProfile = form({ age: field.strict(18), users: array({ name: field('') }) });
const writableAge: WritableSignal<number> = writableProfile.age;
const writableForm: WritableSignal<ReturnType<typeof writableProfile>> = writableProfile;
const writableUsers: WritableSignal<{ name: string }[]> = writableProfile.users;
const readonlyAge: Signal<number> = writableAge.asReadonly();
writableAge.update(value => value + 1);
writableForm.set({ age: readonlyAge(), users: [] });
writableUsers.update(value => [...value, { name: 'Ada' }]);
const writableCollision = form({ set: field('draft'), asReadonly: field('child') });
const writableApi: WritableSignal<ReturnType<typeof writableCollision>> = writableCollision.$api;
writableApi.set({ set: 'published', asReadonly: 'preserved' });
// @ts-expect-error Readonly views must not regain writable operations in the published declarations.
const invalidWritable: WritableSignal<number> = readonlyAge;
