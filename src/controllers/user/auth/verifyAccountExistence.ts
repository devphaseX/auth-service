import { Request } from 'express';
import { getUserRespository } from '../../../models/repos/index';
import { sendResponse } from '../../../util';
import {
  AccountResetRequirement,
  SingleMeansAccountIdentification,
  UserVerificationResponse,
  UserVerificationResult,
} from './auth.type';

function createMessage(type: string, status: string) {
  return `The user with the associated ${type} is ${status} on the database.`;
}

const verifyUser = async (
  payload:
    | Request<null, UserVerificationResult, SingleMeansAccountIdentification>
    | AccountResetRequirement
) => {
  const query = 'type' in payload ? payload : payload.body;
  const foundUser = await getUserRespository().then((Repo) =>
    Repo.findOneBy({ [query.type]: query.value })
  );

  return {
    status: Boolean(foundUser),
    type: foundUser ? 'success' : 'failed',
    statusCode: 200,
    user: foundUser,
    get message() {
      return createMessage(query.type, this.status ? 'found' : 'not found');
    },
  } as ResponsePayloadInfo<UserVerificationResult>;
};

const verifyAccountHandler = sendResponse(verifyUser);

export default verifyAccountHandler;
export type { UserVerificationResponse, SingleMeansAccountIdentification };
export { verifyUser };
