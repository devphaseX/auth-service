import User from '../../models/entity/user/user';

type TokenPayload = Pick<User, 'email'>;
type RefreshTokenPayload = TokenPayload;

export type { RefreshTokenPayload, TokenPayload };
