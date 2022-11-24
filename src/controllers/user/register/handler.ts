import {
  Role,
  type UserFormCredential,
} from '../../../models/entity/user/user';
import { addCreationType, isDevMode, sendResponse, take } from '../../../util';
import { registrationValidator } from './validate';
import dataValidator from '../../../util/validator.util';
import {
  encodeUserPassword,
  formatJoiValidatorErrorMessage,
} from '../shared.util.validate';
import {
  SingleMeansAccountIdentification,
  verifyUser,
} from '../auth/verifyAccountExistence';
import responseMessage from './message.response';
import getUserRespository from '../../../models/repos/user.repo';
import type {
  RegistrationFailedPayload,
  RegistrationSuccessPayload,
} from './register.type';

const acceptableUserFormDataKeys: Array<keyof UserFormCredential> = [
  'first_name',
  'last_name',
  'age',
  'username',
  'email',
  'role',
  'password',
  'repeat_password',
];

async function checkUserRegistrationStatus(form: UserFormCredential) {
  const verificationCheckList: Array<SingleMeansAccountIdentification> = [
    { type: 'email', value: form.email },
  ];

  if (form.username)
    verificationCheckList.push({ type: 'username', value: form.username });

  return Promise.all(verificationCheckList.map(verifyUser)).then((checks) =>
    checks.filter((check) => check.status)
  );
}

const register = sendResponse<
  RegistrationSuccessPayload,
  RegistrationFailedPayload
>(async function (req) {
  const { error: formDataError, value: serializedFormData } =
    await dataValidator(registrationValidator, {
      schemaOption: { abortEarly: false },
    })<UserFormCredential>(take(req.body, acceptableUserFormDataKeys), {
      role: Role.USER,
    });

  if (formDataError) {
    return {
      type: 'failed',
      statusCode: 200,
      message: formatJoiValidatorErrorMessage(formDataError, isDevMode),
    };
  }

  const userStatus = await checkUserRegistrationStatus(serializedFormData);
  if (userStatus.length) {
    return responseMessage.USER_ALREADY_EXIST(userStatus[0]);
  }

  serializedFormData.password = encodeUserPassword(
    serializedFormData.password!
  );

  try {
    await getUserRespository().then((Repo) =>
      Repo.create(addCreationType(serializedFormData, 'email')).save()
    );
  } catch {
    return {
      type: 'failed',
      statusCode: 203,
      message: `Account creation couldn't complete due to unknown reason`,
    };
  }

  return {
    type: 'success',
    statusCode: 200,
  };
});

export default register;
