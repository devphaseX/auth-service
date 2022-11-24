import { getCurrentDataSource } from '../../config/db';
import { getRepository } from '../../util';
import GoogleRegistratedAccount from '../entity/OAuth/GoogleAuth';

const getGoogleOAuthRepo = () =>
  getRepository(GoogleRegistratedAccount)(getCurrentDataSource);

export { getGoogleOAuthRepo };
export default getGoogleOAuthRepo;
