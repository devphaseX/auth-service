import { getCurrentDataSource } from '../../config/db';
import { getRepository } from '../../util';
import ResetToken from '../entity/Token/ResetToken';

const getResetTokenRespository = () =>
  getRepository(ResetToken)(getCurrentDataSource);

export { getResetTokenRespository };
export default getResetTokenRespository;
