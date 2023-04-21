import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { Amplify } from 'aws-amplify'
import { Authenticator } from '@aws-amplify/ui-react'
import '@aws-amplify/ui-react/styles.css'

function setupConfigure () {
  Amplify.configure({
    Auth: {
      // REQUIRED only for Federated Authentication - Amazon Cognito Identity Pool ID
      // identityPoolId: 'XX-XXXX-X:XXXXXXXX-XXXX-1234-abcd-1234567890ab',

      // REQUIRED - Amazon Cognito Region
      region: 'us-east-1',

      // OPTIONAL - Amazon Cognito Federated Identity Pool Region
      // Required only if it's different from Amazon Cognito Region
      // identityPoolRegion: 'XX-XXXX-X',

      // OPTIONAL - Amazon Cognito User Pool ID
      userPoolId: 'us-east-1_ldvDmC9Fe',

      // OPTIONAL - Amazon Cognito Web Client ID (26-char alphanumeric string)
      userPoolWebClientId: '41m82unjghlea984vjpk887qcr',

      // OPTIONAL - Enforce user authentication prior to accessing AWS resources or not
      // mandatorySignIn: false,

      // OPTIONAL - This is used when autoSignIn is enabled for Auth.signUp
      // 'code' is used for Auth.confirmSignUp, 'link' is used for email link verification
      // signUpVerificationMethod: 'code', // 'code' | 'link'

      // OPTIONAL - Configuration for cookie storage
      // Note: if the secure flag is set to true, then the cookie transmission requires a secure protocol
      cookieStorage: {
        domain: 'localhost',
        path: '/',
        expires: 365,
        sameSite: 'strict',
        secure: true,
      },

      // OPTIONAL - customized storage object
      // storage: MyStorage,

      // OPTIONAL - Manually set the authentication flow type. Default is 'USER_SRP_AUTH'
      authenticationFlowType: 'USER_SRP_AUTH',

      //
      // // OPTIONAL - Manually set key value pairs that can be passed to Cognito Lambda Triggers
      // clientMetadata: {myCustomKey: 'myCustomValue'},
      //
      // // OPTIONAL - Hosted UI configuration
      // oauth: {
      //     domain: 'your_cognito_domain',
      //     scope: ['phone', 'email', 'profile', 'openid', 'aws.cognito.signin.user.admin'],
      //     redirectSignIn: 'http://localhost:3000/',
      //     redirectSignOut: 'http://localhost:3000/',
      //     responseType: 'code' // or 'token', note that REFRESH token will only be generated when the responseType is code
    }
  })
}

export default function App () {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', height: '90vh', alignItems: 'center' }}>
      <Authenticator signUpAttributes={['email']}
                     socialProviders={['google']}>
        {({ signOut, user }) => (
          <main>
            <h1>Hello {user.username}</h1>
            <button onClick={signOut}>Sign out</button>
          </main>
        )}
      </Authenticator>
    </div>)
}

function main () {
  setupConfigure()

  // mount
  ReactDOM.render(<App/>, document.getElementById('app'))
}

// bootstrap
main()