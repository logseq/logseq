import '@aws-amplify/ui-react/styles.css'
import { Amplify, Auth, Hub } from 'aws-amplify'
import { LSAuthenticator } from './LSAuthenticator'

function setupAuthConfigure (config) {
  Amplify.configure({
    'aws_project_region': 'us-east-2',
    'aws_cognito_identity_pool_id': 'us-east-2:cc7d2ad3-84d0-4faf-98fe-628f6b52c0a5',
    'aws_cognito_region': 'us-east-2',
    'aws_user_pools_id': 'us-east-2_kAqZcxIeM',
    'aws_user_pools_web_client_id': '1qi1uijg8b6ra70nejvbptis0q',
    'authenticationFlowType': 'USER_SRP_AUTH',
    'oauth': {
      'domain': 'logseq-test2.auth.us-east-2.amazoncognito.com',
      'scope': [
        'phone',
        'email',
        'openid',
        'profile',
        'aws.cognito.signin.user.admin'
      ],
      'redirectSignIn': 'logseq://auth-callback',
      'redirectSignOut': 'logseq://auth-callback',
      'responseType': 'code'
    },
    'federationTarget': 'COGNITO_USER_POOLS',
    'aws_cognito_username_attributes': [
      'EMAIL'
    ],
    'aws_cognito_social_providers': [
      'GOOGLE'
    ],
    'aws_cognito_signup_attributes': [
      'EMAIL'
    ],
    'aws_cognito_mfa_configuration': 'OFF',
    'aws_cognito_mfa_types': [
      'SMS'
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
  LSAuthenticator,
  Auth, Amplify, Hub
}
