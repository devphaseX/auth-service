type RefreshTokenPayload = TokenPayload<{ objectForm: RefreshToken }>;
type AccessTokenPayload = TokenPayload;
type TokenPayload<Extension = {}> = {
  hash: string;
  expires: number;
} & Extension;

interface UserTokenPayload {
  refresh: RefreshTokenPayload;
  access: AccessTokenPayload;
}

export {
  RefreshTokenPayload,
  AccessTokenPayload,
  TokenPayload,
  UserTokenPayload,
};
