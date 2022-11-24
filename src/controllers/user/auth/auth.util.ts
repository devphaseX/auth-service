import type { CookieOptions } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../../config/env';
import {
  createDefaultOptionMerger,
  isObject,
  resolveTimeToSec,
} from '../../../util';
import User from '../../../models/entity/user/user';
import type { TokenPayload } from '../type';
import RefreshToken from '../../../models/entity/Token/RefreshToken';
import { Repository, SubjectWithoutIdentifierError } from 'typeorm';
import { AuthorizationTokenResult, SignJWTOption, TokenKey } from './auth.type';
import getRefreshTokenRepository from '../../../models/repos/refreshToken.repo';

interface JWTResolveTime {
  refresh: number;
  access: number;
}

const resolveTokenExpirationTime = (time: SignJWTOption['expires']) => {
  const extracted = isObject(time) ? time : { refresh: time, access: time };
  let expireTimeKey: keyof typeof extracted;
  for (expireTimeKey in extracted) {
    extracted[expireTimeKey] = resolveTimeToSec(
      extracted[expireTimeKey] as string | number
    );
  }

  return extracted as JWTResolveTime;
};

function createSignJWT<Option extends SignJWTOption>(
  payload: string | object,
  options: Option
): AuthorizationTokenResult<Option> {
  const generateToken = (accessTokenType: TokenKey) => {
    return jwt.sign(
      payload,
      accessTokenType === 'access'
        ? env.JWT_ACCESS_TOKEN_SECRET
        : env.JWT_REFRESH_TOKEN_SECRET,
      {
        expiresIn: resolveTokenExpirationTime(options.expires)[accessTokenType],
      }
    );
  };

  switch (options.type) {
    case 'access':
    case 'refresh':
      return {
        [options.type]: generateToken(options.type),
      } as AuthorizationTokenResult<Option>;
    case 'both':
      return {
        access: generateToken('access'),
        refresh: generateToken('refresh'),
      } as AuthorizationTokenResult<Option>;

    default: {
      throw new TypeError(
        `The value of ${options.type} for options.type is invalid`
      );
    }
  }
}

const getDefaultCookieOption = (): CookieOptions => ({
  httpOnly: true,
  secure: true,
});

const finalizeCookieOption = createDefaultOptionMerger(getDefaultCookieOption);
const getTokenPayload = (user: User): TokenPayload => ({ email: user.email });
const isTokenInvalidated = (token: RefreshToken) =>
  new Date(token.expiresAt).getTime() < Date.now();

const invalidateToken = async (
  token: RefreshToken,
  Repo?: Repository<RefreshToken>
) => {
  Repo = Repo ?? (await getRefreshTokenRepository());
  try {
    await Repo.update(token._id, { expiresAt: Date.now() - 5 });
    return true;
  } catch {
    return false;
  }
};

async function deleteInvalidatedTokens(tokens: Array<RefreshToken>) {
  for (const token of tokens) {
    try {
      await token.remove();
    } catch (e) {
      if (!(e instanceof SubjectWithoutIdentifierError)) {
        throw e;
      }
    }
  }
}

export {
  isObject,
  createSignJWT,
  finalizeCookieOption,
  getTokenPayload,
  invalidateToken,
  isTokenInvalidated,
  resolveTokenExpirationTime,
  deleteInvalidatedTokens,
};
