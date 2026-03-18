import './styles.css'
import { Amplify, Auth, Hub, I18n } from 'aws-amplify'
import { LSAuthenticator, LSAuthenticatorChangePassword } from './LSAuthenticator'
import { dict } from './amplify-i18n-dict'

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
