import { env } from '../../../config/env';
import { clearInvalidatedTokens } from '../../../models/entity/Token/RefreshToken';
import getRefreshTokenRepository from '../../../models/repos/refreshToken.repo';
import getUserRespository from '../../../models/repos/user.repo';
import { sendResponse } from '../../../util';
import { resetRefreshToken } from '../shared.util.validate';
import type { LogoutFailedPayload } from './logout.type';

const logout = sendResponse<void, LogoutFailedPayload>(async (req, res) => {
  const token = await getRefreshTokenRepository().then((Repo) =>
    Repo.findOneBy({ token: req.cookies[env.JWT_REFRESH_TOKEN_NAME] })
  );

  if (!token) {
    return {
      type: 'failed',
      statusCode: 202,
      message: 'Token is invalid',
    };
  }

  const userAssociatedWithToken = await getUserRespository().then((Repo) =>
    Repo.findOneBy({ _id: token.userId })
  );

  if (!userAssociatedWithToken) {
    return {
      type: 'failed',
      statusCode: 202,
      message: 'Token isnt associated with an user.',
    };
  }

  await clearInvalidatedTokens(userAssociatedWithToken, token);
  resetRefreshToken(res);
  return { type: 'success', statusCode: 204 };
});

export default logout;
