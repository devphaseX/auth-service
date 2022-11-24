type DeciderType<Data, Error> =
  | { type: 'success'; value: Data }
  | { type: 'failure'; error: { reason: Error } };

abstract class Option<Data, Error> {
  abstract isSuccess(): this is Success<Data>;
  abstract isFailure(): this is Failure<Error>;

  static create<D, E>(decideFn: () => DeciderType<D, E>) {
    const result = decideFn();
    return result.type === 'success'
      ? new Success(result.value)
      : new Failure(result.error.reason);
  }
}

class Success<T> extends Option<T, never> {
  #result: T;
  constructor(value: T) {
    super();
    this.#result = value;
  }
  isSuccess(): this is Success<T> {
    return true;
  }

  isFailure(): this is Failure<never> {
    return !this.isSuccess();
  }

  unwrap() {
    return this.#result;
  }
}

class Failure<Error> extends Option<never, Error> {
  #reason: Error;
  constructor(reason: Error) {
    super();
    this.#reason = reason;
  }
  isSuccess(): this is Success<never> {
    return !this.isFailure();
  }

  isFailure(): this is Failure<Error> {
    return true;
  }

  inspect(): Error {
    return this.#reason;
  }
}

export { Option, Success, Failure };
