import './styles.css'
import { Amplify, Auth, Hub, I18n } from 'aws-amplify'
import { LSAuthenticator, LSAuthenticatorChangePassword } from './LSAuthenticator'
import { dict } from 'aws-amplify-react/lib-esm/AmplifyI18n'

// fix i18n
dict.zh['Reset Password'] = '重置密码'
dict.zh['Enter your email'] = '请输入邮箱'
dict.zh['Enter your password'] = '请输入密码'
dict.zh['Enter your Username'] = '请输入用户名'
dict.zh['Confirm Password'] = '确认密码'
dict.zh['Please confirm your Password'] = '请确认密码'
dict.zh['Incorrect username or password.'] = '用户名或者密码不正确。如果您的邮箱未验证，请尝试使用用户名(非邮箱)登录，以保证再次邮箱验证流程。'
dict.zh['User already exists'] = '用户名已经存在'
dict.zh['Username or Email'] = '用户名或邮箱'
dict.zh['Enter your Username or Email'] = '请输入用户名或邮箱'

// @ts-ignore attach defaults
dict.en = {
  'Incorrect username or password.': 'Incorrect username or password!   ' +
    'For unconfirmed users, please input your username instead of Email to receive the code.',
  'User already exists': 'Username already exists'
}

const fixesMapping = {
  'Sign Up': ['Sign up', 'Create Account'],
  'Sign In': ['Sign in'],
  'Sign Out': 'Sign out',
  'Send Code': 'Send code',
  'Forgot Password': ['Forgot your password?'],
  'Enter your email': ['Enter your Email'],
  'Enter your password': ['Enter your Password'],
  'Enter your username': ['Enter your Username or Email']
}

Object.keys(dict).forEach((k) => {
  const target = dict[k]
  Object.entries(fixesMapping).forEach(([k1, v1]) => {
    if (target?.hasOwnProperty(k1)) {
      const vs = Array.isArray(v1) ? v1 : [v1]
      vs.forEach(it => {
        target[it] = target[k1]
      })
    }
  })
})

I18n.putVocabularies(dict)

function setupAuthConfigure(config) {

  const {
    region,
    userPoolId,
    userPoolWebClientId,
    identityPoolId,
    oauthDomain,
    oauthProviders
  } = config

  Amplify.configure({
    'aws_project_region': region,
    'aws_cognito_identity_pool_id': identityPoolId,
    'aws_cognito_region': region,
    'aws_user_pools_id': userPoolId,
    'aws_user_pools_web_client_id': userPoolWebClientId,
    'authenticationFlowType': 'USER_SRP_AUTH',
    'oauth': {
      'domain': oauthDomain,
      'scope': [
        'phone',
        'email',
        'openid',
        'profile',
        'aws.cognito.signin.user.admin'
      ],
      'redirectSignIn': 'https://logseq.com/public/auth_callback.html',
      'redirectSignOut': 'https://logseq.com/public/auth_callback.html',
      'responseType': 'code'
    },
    'federationTarget': 'COGNITO_USER_POOLS',
    'aws_cognito_social_providers': oauthProviders || [
      'GOOGLE'
    ],
    'aws_cognito_signup_attributes': [
      'EMAIL'
    ],
    'aws_cognito_password_protection_settings': {
      'passwordPolicyMinLength': 8,
      'passwordPolicyCharacters': []
    },
    'aws_cognito_verification_mechanisms': [
      'EMAIL'
    ]
  })
}

//@ts-ignore
window.LSAmplify = {
  setupAuthConfigure,
  LSAuthenticator, LSAuthenticatorChangePassword,
  Auth, Amplify, Hub, I18n
}
