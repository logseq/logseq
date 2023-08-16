import { Authenticator, CheckboxField, useAuthenticator, AccountSettings } from '@aws-amplify/ui-react'

export function LSAuthenticator({ termsLink, children }: any) {
  return (<div>
    <Authenticator
      formFields={{
        signUp: {
          email: { order: 1 },
          username: { order: 2 },
          password: { order: 3 },
          confirm_password: { order: 4 },
        },
        signIn: {
          username: {
            placeholder: 'Enter your Username or Email',
            label: 'Username or Email'
          }
        }
      }}
      loginMechanisms={['username']}
      socialProviders={['google']}
      components={{
        SignUp: {
          FormFields() {
            const { validationErrors } = useAuthenticator()

            return (
              <>
                {/* Re-use default `Authenticator.SignUp.FormFields` */}
                <Authenticator.SignUp.FormFields/>

                {/* Append & require Terms & Conditions field to sign up  */}
                <CheckboxField
                  errorMessage={validationErrors.acknowledgement as string}
                  hasError={!!validationErrors.acknowledgement}
                  name="acknowledgement"
                  value="yes"
                  label={(<a href={termsLink}>I agree with the Terms & Conditions</a>)}
                />
              </>
            )
          },
        },
      }}
      services={{
        async validateCustomSignUp(formData) {
          if (!formData.acknowledgement) {
            return {
              acknowledgement: '',
            }
          }
        }
      }}
    >
      {children}
    </Authenticator>
  </div>)
}

export function LSAuthenticatorChangePassword(
  {onSuccess, onError}
) {
  return (
    <AccountSettings.ChangePassword onSuccess={onSuccess} onError={onError}/>
  )
}