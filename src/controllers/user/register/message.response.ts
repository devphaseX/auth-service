import { ResponsePayloadResult } from './register.type';

const message = {
  USER_ALREADY_EXIST: (payload: ResponsePayloadResult) =>
    ({
      statusCode: 200,
      type: 'failed',
      message:
        payload.type === 'failed'
          ? payload.message
          : 'This message is a server error, it isn"t meant to be handle by the client side',
    } as ResponsePayloadResult),
};

export default message;
