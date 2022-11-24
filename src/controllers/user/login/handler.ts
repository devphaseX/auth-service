import bcrpyt from 'bcrypt';
import { isDevMode, sendResponse, take } from '../../../util';
import dataValidator from '../../../util/validator.util';
import signInValidatorSchema from './validate';
import {
  formatJoiValidatorErrorMessage,
  setRefreshToken,
} from '../shared.util.validate';
import responseMessage, {
  type LoginFailedPayload,
  type LoginSuccessPayload,
} from './message.response';
import { verifyUser } from '../auth/verifyAccountExistence';
import {
  clearInvalidatedTokens,
  createUserTokens,
  deleteRefreshToken,
} from '../../../models/entity/Token/RefreshToken';
import { UserLoginCredential } from './login.type';
import User from '../../../models/entity/user/user';
import { RequestHandler } from 'express';
import { env } from '../../../config/env';

const checkPasswordForSameness = (
  dbStoredPassword: string,
  receivedPassword: string
) => bcrpyt.compare(receivedPassword, dbStoredPassword);

const login: RequestHandler = async (req, _, next) => {
  const { error: invalidDataError, value: serializeUserData } =
    await dataValidator(signInValidatorSchema, {
      schemaOption: { abortEarly: false },
    })<UserLoginCredential>(take(req.body, ['email', 'password']));

  if (invalidDataError) {
    return {
      statusCode: 200,
      type: 'failed',
      message: formatJoiValidatorErrorMessage(invalidDataError, isDevMode),
    };
  }
  {
    const { email, password } = serializeUserData;
    const { status: accountStatus, user: retrievedUser } = await verifyUser({
      type: 'email',
      value: email,
    });

    if (
      !accountStatus ||
      !(await checkPasswordForSameness(retrievedUser.password!, password!))
    ) {
      console.log('pass two');
      return {
        statusCode: 200,
        type: 'failed',
        message: responseMessage.USER_NOT_FOUND(),
      };
    }
    req.user = retrievedUser;
  }

  if (req.cookies[env.JWT_REFRESH_TOKEN_NAME]) await deleteRefreshToken(req);
  next();
};

const issueAuthUserToken = sendResponse<
  LoginSuccessPayload,
  LoginFailedPayload
>(async (req, res, cleanUpSetter) => {
  const user = req.user as User;
  try {
    const { access: accessToken, refresh: refreshToken } =
      await createUserTokens(user);
    await refreshToken.objectForm.save();
    setRefreshToken(res, refreshToken.hash, refreshToken.expires);
    return {
      statusCode: 200,
      type: 'success',
      token: accessToken.hash,
    };
  } catch (e) {
    return {
      type: 'failed',
      statusCode: 204,
      message: 'Something went wrong while issuing token',
    };
  } finally {
    cleanUpSetter(function () {
      return clearInvalidatedTokens(user);
    });
  }
});

const checkReqHasUser: RequestHandler = (req, _, next) =>
  req.user
    ? next()
    : next({
        type: 'Internal server',
        statusCode: 500,
        message: 'Failed to attached the user to req',
      });

export type { UserLoginCredential };
export { issueAuthUserToken, checkReqHasUser };
export default login;
