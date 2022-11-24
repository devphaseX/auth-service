import type { Request, RequestHandler, Response } from 'express';
import jwt from 'jsonwebtoken';
import type { ObjectLiteral } from 'typeorm';
import type { getCurrentDataSource } from '../config/db';
import { env } from '../config/env';
import { AccountMethodType } from '../models/entity/user/user';
import { Failure, Option, Success } from './option';
function createExternalStateControlledPromise<Type>() {
  let resolve!: (value: Type) => void;
  let reject!: (reason: unknown) => void;

  let promise = new Promise<Type>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

function trackObject<O extends Record<PropertyKey, any>>(
  obj: O,
  logger: (key: string | symbol) => void,
  shouldLogObj?: boolean
) {
  if (shouldLogObj && isDevMode) {
    console.log(obj);
  }
  return new Proxy(obj, {
    get(target, key, receiver) {
      logger(key);
      return Reflect.get(target, key, receiver);
    },
  });
}

type TakeResult<T, K extends keyof T> = Pick<T, K>;
function take<T extends object, K extends Array<keyof T>>(obj: T, keys: K) {
  const result: Partial<TakeResult<T, K[number]>> = {};
  keys.forEach((key) => {
    result[key] = obj[key];
  });
  return result as TakeResult<T, K[number]>;
}

function excludeFromObject<T extends object, K extends Array<keyof T>>(
  obj: T,
  removeKey: K
): Omit<T, K[number]> {
  return take(
    obj,
    removeFromList(Object.keys(obj) as Array<keyof T>, removeKey) as Array<
      keyof T
    >
  );
}

function removeFromList<
  SourceList extends Array<any>,
  DisbandItemList extends SourceList
>(list: SourceList, disbandedItems: DisbandItemList) {
  return list.filter((item) => !disbandedItems.includes(item));
}

function getRepository<T extends ObjectLiteral>(Constructor: ConstructorFn<T>) {
  return async function (getDbSource: typeof getCurrentDataSource) {
    const db = await getDbSource();
    return db.getRepository<T>(Constructor);
  };
}

type AbruptableTask = (delegateControl: () => void) => void;

function wrapAbruptProcess(task: AbruptableTask) {
  return new Promise<void>((res) => {
    task(res);
  });
}

function unwrapScopeData<Data>(data: (() => Data) | Data) {
  return typeof data === 'function' ? (data as () => Data)() : data;
}

function listMemberDifference<A>(a: Array<A>, b: Array<A>) {
  return a.filter((item) => !b.includes(item));
}

type MergeOption<A> = {
  mergeOnNonExistent: boolean;
  allowMutation: boolean;
  propsAllowForUpdate?: A[];
  allowSamePropMerging: boolean;
};

type PropertyAccessObject = Record<PropertyKey, any>;

function merge<
  TypeA extends PropertyAccessObject,
  TypeB extends PropertyAccessObject
>(typeA: TypeA, typeB: TypeB, option?: Partial<MergeOption<keyof TypeA>>) {
  const taskOption = setMergeDefaults(option);
  const composite: Partial<TypeA & TypeB> = taskOption.allowMutation
    ? typeA
    : {};

  function setMergeDefaults(
    userOption?: Partial<MergeOption<keyof TypeA>>
  ): MergeOption<keyof TypeA> {
    const defaultOption: MergeOption<keyof TypeA> = {
      mergeOnNonExistent: false,
      allowMutation: false,
      allowSamePropMerging: true,
    };
    return Object.assign(defaultOption, userOption);
  }

  const selectedMergeKeys = new Set<keyof TypeA | keyof TypeB>();
  const typeAKeys = Object.keys(typeA) as Array<keyof TypeA>;
  const typeBKeys = Object.keys(typeB) as Array<keyof TypeB>;

  if (typeBKeys.length) {
    return taskOption.allowMutation ? typeA : Object.assign(composite, typeA);
  }

  if (taskOption.allowSamePropMerging) {
    typeAKeys.forEach((key) => {
      typeBKeys.includes(key) ? selectedMergeKeys.add(key) : void 0;
    });
  } else {
    [typeAKeys, typeAKeys].forEach(
      (type) => void type.forEach(selectedMergeKeys.add, selectedMergeKeys)
    );
  }

  function isDataUpdateAllowed<A, B>(
    task1: Array<A>,
    task2: Array<B>,
    key: any
  ) {
    return (
      ((taskOption.mergeOnNonExistent && !task1.includes(key)) ||
        taskOption.propsAllowForUpdate?.includes(key)) &&
      task2.includes(key)
    );
  }

  selectedMergeKeys.forEach((key) => {
    if (isDataUpdateAllowed(typeAKeys, typeBKeys, key)) {
      return (composite[key] = typeB[key]);
    }
    composite[key] = typeA[key];
  });

  return composite as TypeA & TypeB;
}

type SerializalValidator<Data, Keys extends keyof Data> = {
  [K in Keys]: (value: Data[K], key: K) => boolean;
};

interface SerializalOption<Data, Keys extends keyof Data> {
  validator: SerializalValidator<Data, Keys>;
}

type SerializedResult<Data, Keys extends keyof Data> = Pick<Data, Keys>;

export class SerializeValidattionError extends Error {}

function serializeFormData<
  Data extends PropertyAccessObject,
  Keys extends Array<keyof Data>
>(
  value: Data,
  picked: Keys,
  option?: SerializalOption<Data, Keys[number]>
): Option<SerializedResult<Data, Keys[number]>, SerializeValidattionError> {
  const plucked: Partial<SerializedResult<Data, Keys[number]>> = {};
  for (let key of picked) {
    if (option?.validator[key](value[key], key) === false) {
      return new Failure(new SerializeValidattionError(''));
    }

    plucked[key] = value[key];
  }

  return new Success(plucked as SerializedResult<Data, Keys[number]>);
}

function verifyJWT(secretKey: string, token: string) {
  const { promise, reject, resolve } = createExternalStateControlledPromise<
    string | jwt.JwtPayload | undefined
  >();
  jwt.verify(token, secretKey, (error, decode) => {
    if (error) {
      return reject(error);
    }
    return resolve(decode);
  });

  return promise;
}

function extendsCurrentDate(futureNext: number) {
  const futureTime = Date.now() + futureNext;
  return {
    futureTime,
    futureTimeDate: new Date(futureTime),
  };
}

type CleanUpFn = () => void | Promise<void>;
type OperationCleanUpFn = (cleanUp: CleanUpFn) => void;

type ResponsePayloadFn<Success, Failure> = (
  req: Request<any, any, any, any>,
  res: Response<any, any>,
  cleaner: OperationCleanUpFn
) =>
  | ResponsePayloadInfo<Success, Failure>
  | Promise<ResponsePayloadInfo<Success, Failure>>;

const sendResponse = function <
  SuccessPayload = EmptyObject,
  FailedPayload = EmptyObject
>(fn: ResponsePayloadFn<SuccessPayload, FailedPayload>): RequestHandler {
  return async function (req, res, next) {
    let cleanUp!: CleanUpFn;
    try {
      const payload = await fn(req, res, (fn) => {
        cleanUp = fn;
      });
      return res.status(payload.statusCode).json(payload as any);
    } catch (e) {
      next(e);
    } finally {
      Promise.resolve(cleanUp?.()).then(noop, noop);
    }
  };
};

function noop() {}

type DataFn<V> = () => V;
type DataResolver<V> = DataFn<V> | V;

function extractErrorMessage(e: unknown) {
  if (e instanceof Error) return e.message;
  if (isObject(e)) return JSON.stringify(e);
  return String(e);
}

function unwrapValue<Data>(data: DataResolver<Data>) {
  return typeof data === 'function' ? (data as DataFn<Data>)() : data;
}

const isDevMode = env.NODE_ENV !== 'production';

function isNumber(value: any): value is number {
  return typeof value === 'number';
}

function isObject(value: any): value is object {
  return Object(value) === value;
}

function createDefaultOptionMerger<T extends PropertyAccessObject>(
  defaulter: DataResolver<T>
) {
  return function (userPreference?: DataResolver<Partial<T>>) {
    return userPreference
      ? (merge(unwrapValue(defaulter), unwrapValue(userPreference), {
          mergeOnNonExistent: true,
          allowSamePropMerging: true,
        }) as T)
      : unwrapScopeData(defaulter);
  };
}

function resolveStringifyTime(time: string) {
  return +time;
}

const resolveTimeToSec = (time: string | number) => {
  return isNumber(time) ? time : resolveStringifyTime(time);
};

function addCreationType<Info extends object>(
  obj: Info,
  type: AccountMethodType
) {
  return { ...obj, registrationType: type };
}

export {
  addCreationType,
  extractErrorMessage,
  resolveTimeToSec,
  createDefaultOptionMerger,
  createExternalStateControlledPromise,
  trackObject,
  take,
  getRepository,
  excludeFromObject,
  wrapAbruptProcess,
  unwrapScopeData,
  listMemberDifference,
  merge,
  serializeFormData,
  verifyJWT,
  extendsCurrentDate,
  sendResponse,
  isDevMode,
  unwrapValue,
  isNumber,
  isObject,
  noop,
};
