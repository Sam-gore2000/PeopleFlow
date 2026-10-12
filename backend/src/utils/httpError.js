export function httpError(status, message, action) {
  const error = new Error(message);
  error.status = status;
  if (action) error.action = action;
  return error;
}
