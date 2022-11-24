import bcrpyt from 'bcrypt';
import { Response } from 'express';
import Joi from 'joi';
import { env } from '../../config/env';
import { extendsCurrentDate } from '../../util';
import { finalizeCookieOption } from './auth/auth.util';

const passwordSchema = Joi.string()
  .min(8)
  .pattern(/^[A-Z]/)
  .message('Password must start with a capital letter')
  .pattern(/[$#_]/)
  .message('password must contain any of the following character [$#_]')
  .pattern(/\D/)
  .message('password must contained at least one numerical character')
  .pattern(/.{8,}/)
  .message('password character must not be less than 8 characters.')
  .required();

const samePasswordSchema = Joi.object({
  password: passwordSchema,
  confirm_password: Joi.ref('password'),
});

const emailSchema = Joi.string().required();

type DataMisMatchErrorMessage = Array<
  [path: string, details: { message: string }]
>;
function formatJoiValidatorErrorMessage(
  error: Joi.ValidationError,
  isDevModeAllowed?: boolean
): DataMisMatchErrorMessage | Joi.ValidationError {
  if (isDevModeAllowed) return error;

  return error.details.map(({ path, message }) => [
    path.join('.'),
    { message },
  ]);
}

function setRefreshToken(
  res: Response,
  refreshToken: string,
  expiresTime: number
) {
  res.cookie(
    env.JWT_REFRESH_TOKEN_NAME,
    refreshToken,
    finalizeCookieOption({ maxAge: expiresTime })
  );
}

function resetRefreshToken(res: Response) {
  setRefreshToken(res, '', 0);
}

function getAccessTokenExpireTime() {
  return extendsCurrentDate(+env.JWT_ACCESS_TOKEN_EXPIRES).futureTime;
}

function getRefreshTokenExpireTime() {
  return extendsCurrentDate(+env.JWT_REFRESH_TOKEN_EXPIRES).futureTime;
}

function encodeUserPassword(password: string) {
  return bcrpyt.hashSync(password, +env.ENCODE_ROUND);
}

export type { DataMisMatchErrorMessage };

export {
  passwordSchema,
  encodeUserPassword,
  samePasswordSchema,
  emailSchema,
  formatJoiValidatorErrorMessage,
  setRefreshToken,
  resetRefreshToken,
  getAccessTokenExpireTime,
  getRefreshTokenExpireTime,
};
