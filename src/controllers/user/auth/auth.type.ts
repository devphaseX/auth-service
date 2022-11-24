import User from '../../../models/entity/user/user';

type TokenKey = 'access' | 'refresh';
type RefreshTokenSuccessPayload = { token: string };
type RefreshTokenFailedPayload = { message: string };
type SingleMeansAccountIdentification =
  | { type: 'email'; value: string }
  | { type: 'username'; value: string }
  | { type: 'google'; value: string }
  | { type: 'apple'; value: string };

type AccountResetRequirement = SingleMeansAccountIdentification;

type UserVerificationResult = (
  | ValidUserVerficationResult
  | InvalidUserVerficationResult
) & { message: string };

type UserVerificationStatus = 'found' | 'not-found';

type ValidUserVerficationResult = {
  status: true;
  user: User;
};

type InvalidUserVerficationResult = {
  status: false;
  user: null;
};

type UserVerificationResponse = Promise<
  ResponsePayloadInfo<UserVerificationResult>
>;

type AuthorizationAccessToken = { access: string };
type AuthorizationRefreshToken = { refresh: string };
type AuthorizationCombineToken = AuthorizationAccessToken &
  AuthorizationRefreshToken;

type AuthorizationTokenResult<Option extends SignJWTOption> =
  Option['type'] extends 'access'
    ? AuthorizationAccessToken
    : Option['type'] extends 'refresh'
    ? AuthorizationRefreshToken
    : AuthorizationCombineToken;

type TokenExpiration = string | number | Date;

type TokenExpirationDelimiter = {
  refresh?: TokenExpiration;
  access?: TokenExpiration;
};

type TokenExpirationOption = TokenExpirationDelimiter | string | number;

type SignJWTOption = {
  expires: TokenExpirationOption;
  type: TokenKey | 'both';
};

export type {
  AuthorizationAccessToken,
  AuthorizationRefreshToken,
  AuthorizationCombineToken,
  UserVerificationStatus,
  TokenKey,
  TokenExpirationOption,
  TokenExpirationDelimiter,
  TokenExpiration,
  AuthorizationTokenResult,
  SignJWTOption,
  RefreshTokenFailedPayload,
  RefreshTokenSuccessPayload,
  AccountResetRequirement,
  UserVerificationResponse,
  UserVerificationResult,
  ValidUserVerficationResult,
  InvalidUserVerficationResult,
  SingleMeansAccountIdentification,
};
