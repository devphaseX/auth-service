import { Request } from 'express';
import { env } from '../../../config/env';
import {
  getResetTokenRespository,
  getUserRespository,
} from '../../../models/repos';
import { extendsCurrentDate, noop, verifyJWT } from '../../../util';
import dataValidator from '../../../util/validator.util';
import { SingleMeansAccountIdentification } from '../auth/auth.type';
import { createSignJWT } from '../auth/auth.util';
import {
  encodeUserPassword,
  samePasswordSchema,
} from '../shared.util.validate';

type ResetPasswordRequirement = Exclude<
  SingleMeansAccountIdentification,
  { type: 'google' | 'apple' }
>;

type ResetTokenPayload = Exclude<
  ResetPasswordRequirement,
  { type: 'username' }
>;

const resetPassword = async (
  req: Request<null, null, ResetPasswordRequirement>
) => {
  const [UserRepo, ResetTokenRepo] = await Promise.all([
    getUserRespository(),
    getResetTokenRespository(),
  ]);

  const userAwaitingRecovery = await UserRepo.findOneBy({
    [req.body.type]: req.body.value,
  });

  if (!userAwaitingRecovery) {
    return {
      statusCode: 403,
    };
  }
  const resetTokenHashed = createSignJWT(
    { type: 'email', value: userAwaitingRecovery.email } as ResetTokenPayload,
    { type: 'access', expires: extendsCurrentDate(60 * 60 * 2).futureTime }
  ).access;

  try {
    await ResetTokenRepo.create({
      userId: userAwaitingRecovery._id,
      resetToken: resetTokenHashed,
    }).save();

    return {
      statusCode: 201,
      resetToken: resetTokenHashed,
    };
  } catch {
    return { statusCode: 403 };
  }
};

interface RecoverPasswordQueryParams {
  token: string;
}

interface PasswordRecovery {
  password: string;
  confirm_password: string;
}
async function recoverPassword(
  req: Request<null, null, PasswordRecovery, RecoverPasswordQueryParams>
) {
  try {
    const tokenPayload = await verifyJWT(
      env.JWT_ACCESS_TOKEN_SECRET,
      req.query.token
    );

    if (!tokenPayload) throw tokenPayload;

    const validationResult = await dataValidator(samePasswordSchema, {
      schemaOption: { abortEarly: false },
    })(req.body);

    if (validationResult.error) {
      return {};
    }

    const [UserRepo, ResetTokenRepo] = await Promise.all([
      getUserRespository(),
      getResetTokenRespository(),
    ]);

    const resetToken = await ResetTokenRepo.findOneBy({
      resetToken: req.query.token,
    });

    if (!resetToken) {
      return {};
    }

    await resetToken.remove().catch(noop);
    const { type, value } = tokenPayload as ResetTokenPayload;
    const user = await UserRepo.findOneBy({ [type]: value });

    if (!user) {
      return {};
    }
    try {
      await UserRepo.update(user._id, {
        password: encodeUserPassword(validationResult.value.password),
      });
    } catch {
      return {};
    }
  } catch {}
}

export { recoverPassword };
export default resetPassword;
