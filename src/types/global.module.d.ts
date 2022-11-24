import { RequestHandler, Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ResponsePayload } from '../controllers/user/type';
import User from '../models/entity/user/user';

type ENV_Type = 'development' | 'production';

declare global {
  type JoiValidationObject<Rec> = {
    [K in keyof Rec]?: Joi.Schema | Array<Joi.SchemaLike>;
  };
  interface LocalSharedValues {
    user?: User;
  }
}
