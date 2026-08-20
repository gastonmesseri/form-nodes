declare class HiddenApply { private readonly apply: never; }
declare class HiddenArguments { private readonly arguments: never; }
declare class HiddenBind { private readonly bind: never; }
declare class HiddenCall { private readonly call: never; }
declare class HiddenCaller { private readonly caller: never; }
declare class HiddenLength { private readonly length: never; }
declare class HiddenName { private readonly name: never; }
declare class HiddenPrototype { private readonly prototype: never; }
declare class HiddenToString { private readonly toString: never; }
declare class HiddenHasInstance { private readonly [Symbol.hasInstance]: never; }

type Hide<TKey extends PropertyKey, TExclude extends PropertyKey, THidden> =
  TKey extends TExclude ? unknown : THidden;

export type HiddenFunctionMembers<TExclude extends PropertyKey = never> =
  & Hide<'apply', TExclude, HiddenApply>
  & Hide<'arguments', TExclude, HiddenArguments>
  & Hide<'bind', TExclude, HiddenBind>
  & Hide<'call', TExclude, HiddenCall>
  & Hide<'caller', TExclude, HiddenCaller>
  & Hide<'length', TExclude, HiddenLength>
  & Hide<'name', TExclude, HiddenName>
  & Hide<'prototype', TExclude, HiddenPrototype>
  & Hide<'toString', TExclude, HiddenToString>
  & Hide<typeof Symbol.hasInstance, TExclude, HiddenHasInstance>;
