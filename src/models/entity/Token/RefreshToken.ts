import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  ObjectID,
  ObjectIdColumn,
  SubjectWithoutIdentifierError,
} from 'typeorm';
import {
  createSignJWT,
  deleteInvalidatedTokens,
  getTokenPayload,
  invalidateToken,
  isTokenInvalidated,
  resolveTokenExpirationTime,
} from '../../../controllers/user/auth/auth.util';
import {
  getAccessTokenExpireTime,
  getRefreshTokenExpireTime,
} from '../../../controllers/user/shared.util.validate';
import getRefreshTokenRepository from '../../repos/refreshToken.repo';
import User from '../user/user';
import type {
  AccessTokenPayload,
  RefreshTokenPayload,
  UserTokenPayload,
} from './types';
import {
  SignJWTOption,
  TokenExpirationOption,
  TokenKey,
} from '../../../controllers/user/auth/auth.type';
import { createDefaultOptionMerger, noop } from '../../../util';
import { Request } from 'express';
import { env } from '../../../config/env';

@Entity('refreshToken')
class RefreshToken extends BaseEntity {
  @ObjectIdColumn()
  _id!: ObjectID;

  @Column()
  token!: string;

  @ManyToOne(() => User, (user) => user.refreshToken, {
    eager: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  user!: User;

  @Column()
  userId!: ObjectID;

  @Column({ type: 'datetime' })
  expiresAt!: number;
}

async function deleteRefreshToken(req: Request) {
  const TokenRepo = await getRefreshTokenRepository();
  const serverToken = await TokenRepo.findOneBy({
    token: req.cookies[env.JWT_REFRESH_TOKEN_NAME],
  });

  console.log('pass three');
  if (serverToken) {
    try {
      await TokenRepo.delete(serverToken._id);
    } catch (e) {
      if (!(e instanceof SubjectWithoutIdentifierError)) {
        await invalidateToken(serverToken, TokenRepo).catch(noop);
      }
    }
  }
}

async function createRefreshToken(
  user: User,
  refreshToken: string,
  expiresTime = getRefreshTokenExpireTime()
) {
  const Token = await getRefreshTokenRepository();
  const newToken = Token.create({
    token: refreshToken,
    expiresAt: expiresTime,
    userId: user._id,
  });

  newToken.user = user;

  return { token: newToken, expires: expiresTime };
}

function getDefaultJwtOptions(): SignJWTOption {
  return {
    type: 'both',
    expires: {
      access: getAccessTokenExpireTime(),
      refresh: getRefreshTokenExpireTime(),
    },
  };
}

function createAccessTokenPayload(
  tokenHashed: string,
  expires: TokenExpirationOption
): AccessTokenPayload {
  return {
    hash: tokenHashed,
    expires: resolveJwtExpiresTime(expires, 'access'),
  };
}

function createRefreshTokenPayload(
  tokenHashed: string,
  tokenObjecttype: RefreshToken,
  expires: TokenExpirationOption
): RefreshTokenPayload {
  return {
    hash: tokenHashed,
    objectForm: tokenObjecttype,
    expires: resolveJwtExpiresTime(expires, 'refresh'),
  };
}

function resolveJwtExpiresTime(time: TokenExpirationOption, type: TokenKey) {
  return resolveTokenExpirationTime(time)[type];
}

const finalizeJwtTokenOption =
  createDefaultOptionMerger<SignJWTOption>(getDefaultJwtOptions);

async function createUserTokens(
  user: User,
  option?: SignJWTOption
): Promise<UserTokenPayload> {
  const jwtOption = finalizeJwtTokenOption(option);
  const { access: accessHashKey, refresh: refreshHashKey } =
    await createSignJWT(getTokenPayload(user), jwtOption);
  const { token, expires } = await createRefreshToken(user, refreshHashKey);

  return {
    access: createAccessTokenPayload(accessHashKey, jwtOption.expires),
    refresh: createRefreshTokenPayload(refreshHashKey, token, expires),
  };
}

async function clearInvalidatedTokens(user: User, usedToken?: RefreshToken) {
  const tokens = await getRefreshTokenRepository().then((Repo) =>
    Repo.findBy({ userId: user._id })
  );

  const sortInvalidateToken = (token: RefreshToken) =>
    isTokenInvalidated(token) || token._id.equals(usedToken!._id);

  await deleteInvalidatedTokens(tokens.filter(sortInvalidateToken));
}
export {
  createRefreshToken,
  clearInvalidatedTokens,
  createUserTokens,
  deleteRefreshToken,
};
export default RefreshToken;
