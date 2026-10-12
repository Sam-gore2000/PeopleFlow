// Wraps a controller so it can simply return its result (or throw).
// Services may return { statusCode, payload } to control the HTTP status.
export function handleRequest(fn) {
  return async (req, res, next) => {
    try {
      const result = await fn(req, res);
      if (res.headersSent) return;
      res.status(result?.statusCode || 200).json(result?.payload ?? result);
    } catch (error) {
      next(error);
    }
  };
}
