import Joi from 'joi';
import User from '../../../models/entity/user/user';
import { DataMisMatchErrorMessage } from '../shared.util.validate';

type UserLoginCredential = Pick<User, 'email' | 'password'>;
type LoginSuccessPayload = { token: string };
type LoginFailedPayload = {
  message: string | DataMisMatchErrorMessage | Joi.ValidationError;
};

export { UserLoginCredential, LoginSuccessPayload, LoginFailedPayload };
