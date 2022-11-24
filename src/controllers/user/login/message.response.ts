import Joi from 'joi';
import { DataMisMatchErrorMessage } from '../shared.util.validate';

type LoginSuccessPayload = { token: string };
type LoginFailedPayload = {
  message: string | DataMisMatchErrorMessage | Joi.ValidationError;
};

export { LoginSuccessPayload, LoginFailedPayload };
export default {
  USER_NOT_FOUND: () => `User not found or password is incorrect.`,
};
