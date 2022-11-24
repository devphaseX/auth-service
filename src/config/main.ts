import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';
import cookiesParser from 'cookie-parser';
import v1 from '../routes/rest/v1';
import setGoogleStrategy from '../controllers/user/oauth/google.oauth';
import passport from 'passport';
import {
  checkReqHasUser,
  issueAuthUserToken,
} from '../controllers/user/login/handler';

const app = express();

app.use(cookiesParser());
app.use(express.json());
app.use(morgan('dev'));
app.use(cors());
app.use(helmet());

function integrateGoogleAuth() {
  setGoogleStrategy(passport);

  app.get(
    '/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
  );

  app.get(
    '/auth/google/callback',
    passport.authenticate('google', { session: false }),
    checkReqHasUser,
    issueAuthUserToken
  );
}

if (process.env.NODE_ENV === 'development') {
  app.use(
    helmet.contentSecurityPolicy({
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          'https://cdn.jsdelivr.net',
          'https://fonts.googleapis.com',
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          'https://cdn.jsdelivr.net',
          'https://fonts.googleapis.com',
        ],
        imgSrc: ["'self'", 'data:', 'http://cdn.jsdelivr.net'],
      },
    })
  );
}

app.use('/api/v1', v1);
integrateGoogleAuth();

export default app;
