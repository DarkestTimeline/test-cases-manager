export const FIX_FIELDS_MESSAGE = "Fix the highlighted fields and try again.";

export function formFailure(prevState, values, { error, fieldErrors = {} }) {
  return {
    error,
    fieldErrors,
    values,
    success: null,
    attempt: (prevState?.attempt ?? 0) + 1,
  };
}

export function formSuccess(prevState, values, message) {
  return {
    error: null,
    fieldErrors: {},
    values,
    success: message,
    attempt: (prevState?.attempt ?? 0) + 1,
  };
}
