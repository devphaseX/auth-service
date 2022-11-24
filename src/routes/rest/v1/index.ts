import { Router } from 'express';
import userRouter from './user';

const apiVersionedRouter = Router();
apiVersionedRouter.use('/user', userRouter);
export default apiVersionedRouter;
