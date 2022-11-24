import { getCurrentDataSource } from '../../config/db';
import { getRepository } from '../../util';
import RefreshToken from '../entity/Token/RefreshToken';

const getRefreshTokenRepository = () =>
  getRepository(RefreshToken)(getCurrentDataSource);

export { getRefreshTokenRepository };
export default getRefreshTokenRepository;
