import { Authenticator } from '@aws-amplify/ui-react'

export function LSAuthenticator ({ children }: any) {
  return (<div>
    <Authenticator
      signUpAttributes={['email']}
      socialProviders={['google']}
    >
      {children}
    </Authenticator>
  </div>)
}