import { Component, viewChild } from '@angular/core';
import { FormNodesModule, FormNodeDirective, useClosestForm, array, createFormPrimitives, field, form, group, required, isFormNode, provideFormNodesConfig, configureGlobalFormNodes, type FormNodeValue, type FieldNode, type GroupNode, type FormNode, type ArrayNode } from '@ngblocks/form-nodes';

const configuredForms = createFormPrimitives({ nullable: false });

const candidate: unknown = configuredForms.field('Marco');
if (!isFormNode(candidate) || candidate() !== 'Marco' || isFormNode({})) {
  throw new Error('The package must export a working node type guard.');
}

class Company {
  constructor(readonly name: string) {}
}

@Component({
  selector: 'package-consumer',
  standalone: true,
  imports: [FormNodesModule],
  providers: [provideFormNodesConfig({ syncInputs: false })],
  template: `
    <form [formNode]="profile">
      <span>{{ profile.submitted() }}</span>
      @if (closestForm(); as closest) { <span>{{ closest.submitted() }}</span> }
      <input #nameBinding="formNode" [formNode]="profile.name">
      <input [formNode]="dynamicAge">
      @for (address of profile.addresses; track address) {
        <input [formNode]="address.city">
      }
    </form>
  `,
})
export class PackageConsumer {
  closestForm = useClosestForm();
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
