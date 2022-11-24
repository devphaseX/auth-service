import { env } from '../../../config/env';
import { sendResponse, verifyJWT } from '../../../util';
import getRefreshTokenRepository from '../../../models/repos/refreshToken.repo';
import getUserRespository from '../../../models/repos/user.repo';
import { setRefreshToken } from '../shared.util.validate';
import {
  clearInvalidatedTokens,
  createUserTokens,
  deleteRefreshToken,
} from '../../../models/entity/Token/RefreshToken';
import type {
  RefreshTokenFailedPayload,
  RefreshTokenSuccessPayload,
} from './auth.type';

const refreshTokenHandler = sendResponse<
  RefreshTokenSuccessPayload,
  RefreshTokenFailedPayload
>(async (req, res, cleanUpFnSetter) => {
  const userRefreshToken = req.cookies[env.JWT_REFRESH_TOKEN_NAME];
  if (!userRefreshToken) {
    return {
      type: 'failed',
      statusCode: 401,
      message: 'Unauthorized user, kindly relogin',
    };
  }

  const dbStoreToken = await getRefreshTokenRepository().then((Repo) =>
    Repo.findOneBy({
      token: userRefreshToken,
    })
  );

  if (!dbStoreToken) {
    return {
      type: 'failed',
      statusCode: 403,
      message: 'Invalid token',
    };
  }

  try {
    await verifyJWT(env.JWT_REFRESH_TOKEN_SECRET, dbStoreToken.token);
    await deleteRefreshToken(req);
  } catch {
    return {
      type: 'failed',
      statusCode: 403,
      message: 'Token invalid',
    };
  }

  const userAssociatedWithToken = await getUserRespository().then((UserRepo) =>
    UserRepo.findOneBy({
      _id: dbStoreToken.userId,
    })
  );

  if (!userAssociatedWithToken) {
    return {
      type: 'failed',
      statusCode: 403,
      message: 'user associated with the token no longer exist',
    };
  }

  try {
    const { access: accessToken, refresh: refreshToken } =
      await createUserTokens(userAssociatedWithToken);
    await refreshToken.objectForm.save();
    setRefreshToken(res, refreshToken.hash, refreshToken.expires);

    return {
      type: 'success',
      statusCode: 201,
      token: accessToken.hash,
    };
  } catch (e) {
    return {
      type: 'failed',
      statusCode: 204,
      message: 'Fail to generate refresh token.',
    };
  } finally {
    cleanUpFnSetter(function () {
      return clearInvalidatedTokens(userAssociatedWithToken);
    });
  }
});

export default refreshTokenHandler;
