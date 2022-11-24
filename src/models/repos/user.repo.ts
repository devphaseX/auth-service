import { getCurrentDataSource } from '../../config/db';
import { getRepository } from '../../util';
import User from '../entity/user/user';

const getUserRespository = () => getRepository(User)(getCurrentDataSource);

export { getUserRespository };
export default getUserRespository;
