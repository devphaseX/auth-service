import Joi from 'joi';
import { UserFormCredential } from '../../../models/entity/user/user';
import { DataMisMatchErrorMessage } from '../shared.util.validate';

type RegistrationSuccessPayload = {};
type RegistrationFailedPayload = {
  message: string | DataMisMatchErrorMessage | Joi.ValidationError;
};

type ResponsePayloadResult = ResponsePayloadInfo<
  RegistrationSuccessPayload,
  RegistrationFailedPayload
>;

type RegisterResponsePayload =
  | ResponsePayloadResult
  | ((form: UserFormCredential) => ResponsePayloadResult);

export {
  RegistrationSuccessPayload,
  RegistrationFailedPayload,
  ResponsePayloadResult,
  RegisterResponsePayload,
};
