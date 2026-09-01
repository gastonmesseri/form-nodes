export type Equal<TLeft, TRight> =
  (<T>() => T extends TLeft ? 1 : 2) extends
  (<T>() => T extends TRight ? 1 : 2)
    ? true
    : false;

export type Expect<TValue extends true> = TValue;

export type HasKey<TValue, TKey extends PropertyKey> = TKey extends keyof TValue ? true : false;
