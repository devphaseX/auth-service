import Joi from 'joi';
import { Role, UserFormCredential } from '../../../models/entity/user/user';
import { emailSchema, passwordSchema } from '../shared.util.validate';

type RegistrationValidatorOption = {
  [K in keyof UserFormCredential]?: Joi.SchemaLike | Array<Joi.SchemaLike>;
};

const createNameValidator = (nameType: string, min: number) =>
  Joi.string().min(min).message(`${nameType} should not be less than ${min}`);

const registrationValidator = Joi.object({
  first_name: createNameValidator('first_name', 2).required(),
  last_name: createNameValidator('last_name', 2).required(),
  username: createNameValidator('username', 2),
  email: emailSchema,
  role: Joi.string().allow(Role.USER, Role.ADMIN, Role.CREATOR),
  age: Joi.number(),
  password: passwordSchema,
  repeat_password: Joi.ref('password'),
} as RegistrationValidatorOption);



export { registrationValidator };
