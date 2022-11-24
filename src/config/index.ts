import app from './main';
import { env } from './env';
import { createDBConnection } from './db';
import apolloServer from '../routes/graphql';
import { wrapAbruptProcess } from '../util';

const port = Number(env.PORT ?? env.FALLBACK_PORT);

const corsOptions = {
  origin: `http://localhost:${port}`,
  credentials: true,
};
async function setupApplication() {
  try {
    await createDBConnection();
    await apolloServer.start();
    apolloServer.applyMiddleware({
      app,
      path: '/api/graphql',
      cors: corsOptions,
    });

    await wrapAbruptProcess((delegate) => app.listen(port, delegate));
    console.log(`server is runnning on port: ${port}`);
  } catch (e) {
    console.log(`The server got destroy `, e);
  }
}

setupApplication();
