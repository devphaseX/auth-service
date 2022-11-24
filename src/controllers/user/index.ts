export { default as login } from './login/handler';
export { default as register } from './register/handler';
export {
  default as resetPassword,
  recoverPassword,
} from './resetPassword/resetPassword';
export { default as logout } from './logout/logout.auth';
export { default as refreshToken } from './auth/refreshToken';
export * as googleAuth from './oauth/google.oauth';
