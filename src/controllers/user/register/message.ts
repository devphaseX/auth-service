const FAILED_RESPOND = {
  EMAIL_ALREADY_EXIST: {
    status: 201,
    error: {
      type: ['email'],
      message: 'Sorry we found already with this email address.',
    },
  },
};

export { FAILED_RESPOND };
