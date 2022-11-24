import { Router } from 'express';
import {
  login,
  logout,
  resetPassword,
  recoverPassword,
  register,
  refreshToken,
} from '../../../../controllers/user';
import {
  checkReqHasUser,
  issueAuthUserToken,
} from '../../../../controllers/user/login/handler';

const route = Router();

route.post('/create', register);
route.post('/login', login, checkReqHasUser, issueAuthUserToken);
route.delete('/logout', logout);
route.get('/token/refresh', refreshToken);
route.post('/passsword/forget', resetPassword);
route.patch('/password/recovery/:token', recoverPassword);

export default route;
