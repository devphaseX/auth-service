interface ENV {
  DB_USERNAME: string;
  DB_PASSWORD: string;
  DB_TYPE: 'mongodb';
  DB_HOST: string;
  DB_PORT: number;
  DB_NAME: string;
  DB_SYNCHRONIZE: 'true' | 'false';
  PORT: number;
  FALLBACK_PORT: number;
  NODE_ENV: ENV_Type;
  ENCODE_ROUND: string;
  JWT_REFRESH_TOKEN_NAME: string;
  JWT_ACCESS_TOKEN_SECRET: string;
  JWT_REFRESH_TOKEN_SECRET: string;
  JWT_ACCESS_TOKEN_EXPIRES: number;
  JWT_REFRESH_TOKEN_EXPIRES: number;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
}

namespace NodeJS {
  interface Process {
    env: ENV;
  }
}

type ConstructorFn<T> = { new (): T };

type DataFunction<Data> = () => Data;

type ReceivedData<Data> = Data | DataFunction<Data>;

type AccountVerificationRequirement =
  | { type: 'email'; value: string }
  | { type: 'username'; value: string };

type SuccessRespond<Payload> = {
  type: 'success';
} & Payload;

type FailureRespond<Payload> = {
  type: 'failed';
} & Payload;

type ResponsePayloadInfo<SuccessPayload, FailedPayload = SuccessPayload> = (
  | SuccessRespond<SuccessPayload>
  | FailureRespond<FailedPayload>
) & { statusCode: number };

type EmptyObject = {};
