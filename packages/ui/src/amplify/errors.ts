type AuthErrorLike = {
  code?: string
  name?: string
  message?: string
}

function getAuthErrorName(error: unknown) {
  const authError = (error ?? {}) as AuthErrorLike
  return authError.name || authError.code || ''
}

export function getAuthErrorMessageKey(error: unknown) {
  switch (getAuthErrorName(error)) {
    case 'UserNotFoundException':
      return 'AUTH_ERROR_USER_NOT_FOUND'
    case 'NotAuthorizedException':
      return 'AUTH_ERROR_INVALID_CREDENTIALS'
    case 'UserNotConfirmedException':
      return 'AUTH_ERROR_USER_NOT_CONFIRMED'
    case 'UsernameExistsException':
      return 'AUTH_ERROR_USERNAME_EXISTS'
    case 'InvalidPasswordException':
      return 'PW_POLICY_TIP'
    case 'CodeMismatchException':
      return 'AUTH_ERROR_CODE_MISMATCH'
    case 'ExpiredCodeException':
      return 'AUTH_ERROR_CODE_EXPIRED'
    case 'LimitExceededException':
    case 'TooManyRequestsException':
      return 'AUTH_ERROR_TOO_MANY_REQUESTS'
    case 'TooManyFailedAttemptsException':
      return 'AUTH_ERROR_TOO_MANY_ATTEMPTS'
    case 'CodeDeliveryFailureException':
      return 'AUTH_ERROR_CODE_DELIVERY_FAILED'
    case 'UserAlreadyAuthenticatedException':
      return 'AUTH_ERROR_ALREADY_AUTHENTICATED'
    case 'InvalidParameterException':
      return 'AUTH_ERROR_INVALID_PARAMETER'
    default:
      return 'AUTH_ERROR_GENERIC'
  }
}
