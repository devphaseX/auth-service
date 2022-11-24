import { DataSource } from 'typeorm';
import GoogleRegistratedAccount from '../../models/entity/OAuth/GoogleAuth';
import RefreshToken from '../../models/entity/Token/RefreshToken';
import ResetToken from '../../models/entity/Token/ResetToken';
import Student from '../../models/entity/user/student';
import User from '../../models/entity/user/user';
import { createExternalStateControlledPromise } from '../../util';
import { env } from '../env';

let _establish: (value: DataSource) => void;
let _terminate: (reason: unknown) => void;
let dataSource: Promise<DataSource>;
let isDBConnectionEstablished = false;

({
  promise: dataSource,
  resolve: _establish,
  reject: _terminate,
} = createExternalStateControlledPromise<DataSource>());

function getCurrentDataSource() {
  return dataSource;
}

const createDBConnection = async () => {
  if (isDBConnectionEstablished) return getCurrentDataSource();

  const source = new DataSource({
    type: env.DB_TYPE,
    host: env.DB_HOST,
    port: env.DB_PORT,
    url: buildMongoLocalURL(env.DB_HOST, env.DB_PORT, env.DB_NAME),
    username: env.DB_USERNAME,
    password: env.DB_PASSWORD,
    entities: [
      User,
      Student,
      RefreshToken,
      ResetToken,
      GoogleRegistratedAccount,
    ],
    database: env.DB_NAME,
    synchronize: env.DB_SYNCHRONIZE === 'true' ? true : false,
    useUnifiedTopology: true,
    useNewUrlParser: true,
  });

  try {
    await source.initialize();
    console.log('Database connection established.');
    isDBConnectionEstablished = true;
    _establish(source);
  } catch (e) {
    _terminate(e);
    throw e;
  } finally {
    if (!isDBConnectionEstablished) {
      await source.destroy();
    }
  }
};

function buildMongoLocalURL(host: string, port: number, type: string) {
  return `${host}:${port}/${type}`;
}

export { createDBConnection, getCurrentDataSource };
