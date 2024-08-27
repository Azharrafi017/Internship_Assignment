const ErrorHandler = (err, req, res, next) => {
  res.status(err.statusCode).json({
    code: err.statusCode,
    status: false,
    message: err.message,
    stack: err.stack,
  });
};

export default ErrorHandler;
