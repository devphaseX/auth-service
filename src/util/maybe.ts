abstract class Maybe<T> {
  abstract isSome(): this is Some<T>;
  abstract isNone(): this is None;
  abstract and<U>(other: Maybe<U>): Maybe<U>;
  abstract unwrapOr(defaultValue: T): T;
}

class Some<T> extends Maybe<T> {
  #value: T;
  constructor(value: T) {
    super();
    this.#value = value;
  }

  isSome(): this is Some<T> {
    return true;
  }

  isNone(): this is None {
    return false;
  }

  and<U>(other: Maybe<U>) {
    return other;
  }

  unwrap() {
    return this.#value;
  }

  unwrapOr(defaultValue: T): T {
    return this.unwrap() ?? defaultValue;
  }
}

class None extends Maybe<never> {
  isNone(): this is None {
    return true;
  }

  isSome(): this is Some<never> {
    return false;
  }
  and<U>(other: Maybe<U>) {
    return other;
  }

  unwrapOr<T>(defaultValue: T): T {
    return defaultValue;
  }
}

export { Some, None, Maybe };
