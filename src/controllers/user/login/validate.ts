import Joi from 'joi';
import { UserLoginCredential } from './handler';
import { emailSchema, passwordSchema } from '../shared.util.validate';

type SignInSchema = JoiValidationObject<UserLoginCredential>;

const signInValidatorSchema = Joi.object({
  email: emailSchema,
  password: passwordSchema,
} as SignInSchema);

export default signInValidatorSchema;
