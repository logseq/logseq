import { Button } from '@/components/ui/button'
import { Input, InputProps } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { FormHTMLAttributes, useEffect, useState } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircleIcon, Loader2Icon, LucideEye, LucideEyeClosed, LucideX } from 'lucide-react'
import { AuthFormRootContext, t, useAuthFormState } from './core'
import * as Auth from 'aws-amplify/auth'
import { Skeleton } from '@/components/ui/skeleton'
import * as React from 'react'

function ErrorTip({ error, removeError }: {
  error: string | { variant?: 'warning' | 'destructive', title?: string, message: string | any },
  removeError?: () => void
}) {
  if (!error) return null
  if (typeof error === 'string') {
    error = { message: error }
  }

  return (
    <Alert variant={error.variant || 'destructive'} className={'relative'}>
      <AlertCircleIcon size={18}/>
      {error.title && <AlertTitle>{error.title}</AlertTitle>}
      <AlertDescription>
        <p>
          {(typeof error.message === 'string' ? error.message : JSON.stringify(error.message))?.split('\n')
            .map((line: string, idx: number) => {
              return <span key={idx}>{line}<br/></span>
            })}
        </p>
      </AlertDescription>
      <a className={'close absolute right-0 top-0 opacity-50 hover:opacity-80 p-2'}
         onClick={() => removeError?.()}>
        <LucideX size={16}/>
      </a>
    </Alert>
  )
}

function InputRow(
  props: InputProps & { label: string | React.ReactNode },
) {
  const { errors, setErrors } = useAuthFormState()
  const { label, type, ...rest } = props
  const isPassword = type === 'password'
  const error = props.name && errors?.[props.name]
  const [localType, setLocalType] = useState<string>(type || 'text')
  const [showPassword, setShowPassword] = useState<boolean>(false)
  const removeError = () => {
    if (props.name && errors?.[props.name]) {
      const newErrors = { ...errors }
      delete newErrors[props.name]
      setErrors(newErrors)
    }
  }

  return (
    <div className={'relative w-full flex flex-col gap-3 pb-1'}>
      <Label htmlFor={props.id}>
        {label}
      </Label>
      <Input type={localType} {...rest as any} />

      {isPassword && (
        <a className={'absolute px-2 right-1 top-7 py-3  flex items-center opacity-50 hover:opacity-80 select-none'}
           onClick={() => {
             setShowPassword(!showPassword)
             setLocalType(showPassword ? 'password' : 'text')
           }}
        >
          {showPassword ? <LucideEye size={14}/> : <LucideEyeClosed size={14}/>}
        </a>
      )}

      {error &&
        <div className={'pt-1'}>
          <ErrorTip error={error} removeError={removeError}/>
        </div>
      }
    </div>
  )
}

function FormGroup(props: FormHTMLAttributes<any>) {
  const { className, children, ...reset } = props
  return (
    <form className={cn('relative flex flex-col justify-center items-center gap-4 w-full', className)}
          {...reset}>
      {children}
    </form>
  )
}

// 1. Password must be at least 8 characters
// 2. Password must have lowercase characters
// 3. Password must have uppercase characters
// 4. Password must have symbol characters
function validatePasswordPolicy(password: string) {
  if (!password ||
    password.length < 8 ||
    !/[a-z]/.test(password) ||
    !/[A-Z]/.test(password) ||
    !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password)
  ) {
    throw new Error(t('PW_POLICY_TIP'))
  }
}

function useCountDown() {
  const [countDownNum, setCountDownNum] = useState<number>(0)
  const startCountDown = () => {
    setCountDownNum(60)
    const interval = setInterval(() => {
      setCountDownNum((num) => {
        if (num <= 1) {
          clearInterval(interval)
          return 0
        }
        return num - 1
      })
    }, 1000)
  }

  useEffect(() => {
    return () => {
      setCountDownNum(0)
    }
  }, [])

  return { countDownNum, startCountDown, setCountDownNum }
}

export function LoginForm() {
  const { setErrors, setCurrentTab, onSessionCallback, userSessionRender } = useAuthFormState()
  const [loading, setLoading] = useState<boolean>(false)
  const [sessionUser, setSessionUser] = useState<any>(null)
  const loadSession = async () => {
    try {
      const ret = await Auth.fetchAuthSession()
      if (!ret?.userSub) throw new Error('no session')
      const user = await Auth.getCurrentUser()
      onSessionCallback?.({ ...ret, user })
      const tokens = ret.tokens
      setSessionUser({
        ...user, signInUserSession: {
          idToken: { jwtToken: tokens?.idToken?.toString() },
          accessToken: { jwtToken: tokens?.accessToken.toString() },
          refreshToken: null
        }
      })
      await (new Promise(resolve => setTimeout(resolve, 100)))
    } catch (e) {
      console.warn('no current session:', e)
      setSessionUser(false)
    }
  }

  useEffect(() => {
    // check current auth session
    loadSession()
  }, [])

  if (sessionUser === null) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-4 w-[250px]"/>
        <Skeleton className="h-4 w-[200px]"/>
      </div>)
  }

  const signOut = async () => {
    await Auth.signOut()
    setSessionUser(false)
    setErrors(null)
  }

  if (sessionUser?.username) {
    if (userSessionRender) {
      if (typeof userSessionRender === 'function') {
        return userSessionRender({ sessionUser, signOut })
      }
      return userSessionRender
    }

    return (
      <div className={'w-full text-center'}>
        <p className={'mb-4'}>{t('You are already logged in as')} <strong>{sessionUser.username}</strong></p>
        <Button variant={'secondary'} className={'w-full'} onClick={signOut}>
          {t('Sign out')}
        </Button>
      </div>
    )
  }

  return (
    <FormGroup onSubmit={async (e) => {
      setErrors(null)
      e.preventDefault()

      // get submit form input data
      const formData = new FormData(e.target as HTMLFormElement)
      const data = Object.fromEntries(formData.entries())

      // sign in logic here
      try {
        setLoading(true)
        const username = (data.email as string)?.trim()
        const ret = await Auth.signIn({ username, password: data.password as string })
        const nextStep = ret?.nextStep?.signInStep
        if (!nextStep) throw new Error(JSON.stringify(ret))
        switch (nextStep) {
          case 'CONFIRM_SIGN_UP':
          case 'CONFIRM_SIGN_IN_WITH_EMAIL_CODE':
          case 'CONFIRM_SIGN_IN_WITH_TOTP_CODE':
            setCurrentTab({ type: 'confirm-code', props: { user: { ...ret, username }, nextStep } })
            return
          case 'RESET_PASSWORD':
            setCurrentTab({ type: 'reset-password', props: { user: { ...ret, username }, nextStep } })
            return
          case 'DONE':
            // signed in
            await loadSession()
            return
          default:
            throw new Error('Unsupported sign-in step: ' + nextStep)
        }
      } catch (e) {
        setErrors({ password: { message: (e as Error).message, title: t('Bad Response.') } })
        console.error(e)
      } finally {
        setLoading(false)
      }
    }}>
      <InputRow id="email" type="text" required={true} name="email" autoFocus={true} label={t('Email')}/>
      <InputRow id="password" type="password" required={true} name="password" label={t('Password')}/>

      <div className={'w-full'}>
        <Button type="submit" disabled={loading} className={'w-full'}>
          {loading && <Loader2Icon className="animate-spin mr-1" size={16}/>}
          {t('Sign in')}
        </Button>
        <p className={'pt-4 text-center'}>

          <span className={'text-sm'}>
            <span className={'opacity-50'}>{t('Don\'t have an account?')} </span>
            <a
              onClick={() => setCurrentTab('signup')}
              className={'underline opacity-60 hover:opacity-80'}
            >{t('Sign up')}</a>
            <br/>
            <span className={'opacity-50'}>{t('or')} &nbsp;</span>
          </span>

          <a onClick={() => {
            setCurrentTab('reset-password')
          }} className={'text-sm opacity-60 hover:opacity-80 underline'}>
            {t('Forgot your password?')}
          </a>
        </p>
      </div>
    </FormGroup>
  )
}

export function SignupForm() {
  const { setCurrentTab, setErrors } = useAuthFormState()
  const [loading, setLoading] = useState<boolean>(false)

  return (
    <>
      <FormGroup onSubmit={async (e) => {
        setErrors(null)
        e.preventDefault()

        // get submit form input data
        const formData = new FormData(e.target as HTMLFormElement)
        const data = Object.fromEntries(formData.entries()) as any

        try {
          validatePasswordPolicy(data.password)
        } catch (e) {
          setErrors({
            password: {
              message: (e as Error).message,
              title: t('Invalid Password')
            }
          })
          return
        }

        if (data.password !== data.confirm_password) {
          setErrors({
            confirm_password: {
              message: t('Passwords do not match.'),
              title: t('Invalid Password')
            }
          })
          return
        }

        try {
          setLoading(true)
          const ret = await Auth.signUp({
            username: data.username as string,
            password: data.password as string,
            options: {
              userAttributes: {
                email: data.email as string,
              }
            }
          })

          if (ret.isSignUpComplete) {
            // TODO: auto sign in
            if (ret.nextStep?.signUpStep === 'COMPLETE_AUTO_SIGN_IN') {
              const { nextStep } = await Auth.autoSignIn()
              if (nextStep.signInStep === 'DONE') {
                // signed in
                setCurrentTab('login')
              }
            }

            setCurrentTab('login')
            return
          } else {
            if (ret.nextStep?.signUpStep === 'CONFIRM_SIGN_UP') {
              setCurrentTab({
                type: 'confirm-code',
                props: {
                  user: { ...ret, username: data.username },
                  nextStep: 'CONFIRM_SIGN_UP'
                }
              })
            }
            return
          }
        } catch (e: any) {
          console.error(e)
          const error = { title: t('Bad Response.'), message: (e as Error).message }
          let k = 'confirm_password'
          if (e.name === 'UsernameExistsException') {
            k = 'username'
          }
          setErrors({ [k]: error })
        } finally {
          setLoading(false)
        }
      }}>
        <InputRow id="email" type="email" name="email" autoFocus={true} required={true} label={t('Email')}/>
        <InputRow id="username" type="text" name="username" required={true} label={t('Username')}/>
        <InputRow id="password" type="password" name="password"
                  required={true}
                  placeholder={t('Password')}
                  label={t('Password')}/>
        <InputRow id="confirm_password" type="password" name="confirm_password"
                  required={true}
                  placeholder={t('Confirm Password')}
                  label={t('Confirm Password')}/>
        <div className={'-mt-1'}>
          <span className={'text-sm opacity-50'}>
            {t('By signing up, you agree to our')}&nbsp;
            <a href="https://logseq.com/terms"
               target={'_blank'}
               className={'underline hover:opacity-100'}>{t('Terms of Service')}</a>
            {t(' and ')}
            <a href="https://logseq.com/privacy-policy"
               target={'_blank'}
               className={'underline hover:opacity-100'}>{t('Privacy Policy')}</a>.
          </span>
        </div>
        <div className={'w-full'}>
          <Button type="submit" disabled={loading} className={'w-full'}>
            {loading && <Loader2Icon className="animate-spin mr-1" size={16}/>}
            {t('Create account')}
          </Button>
        </div>

        <p className={'pt-1 text-center'}>
          <a onClick={() => setCurrentTab('login')}
             className={'text-sm opacity-60 hover:opacity-80 underline'}>
            {t('Back to login')}
          </a>
        </p>
      </FormGroup>
    </>
  )
}

export function ResetPasswordForm() {
  const [isSentCode, setIsSentCode] = useState<boolean>(false)
  const [sentUsername, setSentUsername] = useState<string>('')
  const { setCurrentTab, setErrors } = useAuthFormState()
  const { countDownNum, startCountDown } = useCountDown()
  const [loading, setLoading] = useState<boolean>(false)

  useEffect(() => {
    setErrors({})
  }, [isSentCode])

  return (
    <FormGroup
      autoComplete={'off'}
      onSubmit={async (e) => {
        setErrors(null)
        e.preventDefault()

        // get submit form input data
        const formData = new FormData(e.target as HTMLFormElement)
        const data = Object.fromEntries(formData.entries())

        if (!isSentCode) {
          try {
            setLoading(true)

            const username = (data.email as string)?.trim()
            // send reset code
            const ret = await Auth.resetPassword({ username })
            console.debug('[Auth] reset pw code sent: ', ret)
            setSentUsername(username)
            startCountDown()
            setIsSentCode(true)
          } catch (error) {
            console.error('Error sending reset code:', error)
            setErrors({ email: { message: (error as Error).message, title: t('Bad Response.') } })
          } finally {
            setLoading(false)
          }
        } else {
          // confirm reset password
          if ((data.password as string)?.length < 8) {
            setErrors({
              password: {
                message: t('Password must be at least 8 characters.'),
                title: t('Invalid Password')
              }
            })
            return
          } else if (data.password !== data.confirm_password) {
            setErrors({
              confirm_password: {
                message: t('Passwords do not match.'),
                title: t('Invalid Password')
              }
            })
            return
          } else {
            try {
              setLoading(true)
              const ret = await Auth.confirmResetPassword({
                username: sentUsername,
                newPassword: data.password as string,
                confirmationCode: data.code as string
              })

              console.debug('[Auth] confirm reset pw: ', ret)
              setCurrentTab('login')
            } catch (error) {
              console.error('Error confirming reset password:', error)
              setErrors({ 'confirm_password': { message: (error as Error).message, title: t('Bad Response.') } })
            } finally {
              setLoading(false)
            }
          }
        }
      }}>
      {isSentCode ? (
        <>
          <div className={'w-full opacity-60 flex justify-end relative h-0 z-[2]'}>
            {countDownNum > 0 ? (
              <span className={'text-sm opacity-50 select-none absolute top-3 right-0'}>
                {countDownNum}s
              </span>
            ) : (<a onClick={async () => {
              startCountDown()
              try {
                const ret = await Auth.resetPassword({ username: sentUsername })
                console.debug('[Auth] reset pw code re-sent: ', ret)
              } catch (error) {
                console.error('Error resending reset code:', error)
                setErrors({ email: { message: (error as Error).message, title: t('Bad Response.') } })
              } finally {}
            }} className={'text-sm opacity-70 hover:opacity-90 underline absolute top-3 right-0 select-none'}>
              {t('Resend code')}
            </a>)}
          </div>
          <InputRow id="code" type="text" name="code" required={true}
                    placeholder={'123456'}
                    autoComplete={'off'}
                    label={t('Enter the code sent to your email')}/>

          <InputRow id="password" type="password" name="password" required={true}
                    placeholder={t('New Password')}
                    label={t('New Password')}/>

          <InputRow label={t('Confirm Password')}
                    id="confirm_password" type="password" name="confirm_password" required={true}
                    placeholder={t('Confirm Password')}/>

          <div className={'w-full'}>
            <Button type="submit"
                    className={'w-full'}
                    disabled={loading}
            >
              {loading && <Loader2Icon className="animate-spin mr-1" size={16}/>}
              {t('Reset password')}
            </Button>

            <p className={'pt-4 text-center'}>
              <a onClick={() => setCurrentTab('login')}
                 className={'text-sm opacity-60 hover:opacity-80 underline'}>
                {t('Back to login')}
              </a>
            </p>
          </div>
        </>
      ) : (
        <>
          <InputRow id="email" type="email" name="email" required={true}
                    placeholder={'you@xx.com'}
                    autoFocus={true}
                    label={t('Enter your email')}/>
          <div className={'w-full'}>
            <Button type="submit"
                    className={'w-full'}
                    disabled={loading}
            >
              {loading && <Loader2Icon className="animate-spin mr-1" size={16}/>}
              {t('Send code')}
            </Button>

            <p className={'pt-3 text-center'}>
              <a onClick={() => setCurrentTab('login')}
                 className={'text-sm opacity-60 hover:opacity-80 underline'}>
                {t('Back to login')}
              </a>
            </p>
          </div>
        </>
      )}
    </FormGroup>
  )
}

export function ConfirmWithCodeForm(
  props: { user: any, nextStep: any }
) {
  const { setCurrentTab, setErrors } = useAuthFormState()
  const [loading, setLoading] = useState<boolean>(false)
  const isFromSignIn = props.user?.hasOwnProperty('isSignedIn')
  const signUpCodeDeliveryDetails = props.user?.nextStep?.codeDeliveryDetails
  const { countDownNum, startCountDown, setCountDownNum } = useCountDown()

  return (
    <FormGroup
      autoComplete={'off'}
      onSubmit={async (e) => {
        setErrors(null)
        e.preventDefault()

        // get submit form input data
        const formData = new FormData(e.target as HTMLFormElement)
        const data = Object.fromEntries(formData.entries())

        try {
          setLoading(true)
          if (props.nextStep === 'CONFIRM_SIGN_UP') {
            const ret = await Auth.confirmSignUp({
              username: props.user?.username,
              confirmationCode: data.code as string,
            })

            if (ret.nextStep?.signUpStep === 'COMPLETE_AUTO_SIGN_IN') {
              const { nextStep } = await Auth.autoSignIn()
              if (nextStep.signInStep === 'DONE') {
                // signed in
                setCurrentTab('login')
                return
              }
            }

            setCurrentTab('login')
          } else {
            const ret = await Auth.confirmSignIn({
              challengeResponse: data.code as string,
            })

            console.debug('confirmSignIn: ', ret)
          }
        } catch (e) {
          setErrors({ code: { message: (e as Error).message, title: t('Bad Response.') } })
          console.error(e)
        } finally {
          setLoading(false)
        }
      }}>

      <p className={'pb-2 opacity-60'}>
        {isFromSignIn ? t('CODE_ON_THE_WAY_TIP') : (
          signUpCodeDeliveryDetails &&
          <span>{t('We have sent a numeric verification code to your email address at')}&nbsp;<code>
            {signUpCodeDeliveryDetails.destination}.
          </code></span>
        )}
      </p>

      {/*<pre>*/}
      {/*  {JSON.stringify(props.user, null, 2)}*/}
      {/*  {JSON.stringify(props.nextStep, null, 2)}*/}
      {/*</pre>*/}

      <span className={'w-full flex justify-end relative h-0 z-10'}>
        {countDownNum > 0 ? (
          <span className={'text-sm opacity-50 select-none absolute -bottom-8'}>
            {countDownNum}s
          </span>
        ) : <a
          className={'text-sm opacity-50 hover:opacity-80 active:opacity-50 select-none underline absolute -bottom-8'}
          onClick={async (e) => {
            e.stopPropagation()
            // resend code
            try {
              startCountDown()
              if (props.nextStep === 'CONFIRM_SIGN_UP') {
                const ret = await Auth.resendSignUpCode({
                  username: props.user?.username
                })

                console.debug('resendSignUpCode: ', ret)
              } else {
                // await Auth.resendSignInCode(props.user)
              }
            } catch (e) {
              setErrors({ code: { message: (e as Error).message, title: t('Bad Response.') } })
              setCountDownNum(0)
              console.error(e)
            } finally {}
          }}>{t('Resend code')}</a>
        }
      </span>
      <InputRow id="code" type="text" name="code" required={true}
                placeholder={'123456'}
                autoComplete={'off'}
                autoFocus={true}
                label={t('Enter the code sent to your email')}/>

      <div className={'w-full'}>
        <Button type="submit"
                className={'w-full'}
                disabled={loading}
        >
          {loading && <Loader2Icon className="animate-spin mr-1" size={16}/>}
          {t('Confirm')}
        </Button>

        <p className={'pt-4 text-center'}>
          <a onClick={() => setCurrentTab('login')}
             className={'text-sm opacity-60 hover:opacity-80 underline'}>
            {t('Back to login')}
          </a>
        </p>
      </div>
    </FormGroup>
  )
}

export function LSAuthenticator(props: any) {
  const [errors, setErrors] = React.useState<string | null>(null)
  const [currentTab, setCurrentTab] = React.useState<'login' | 'signup' | 'reset-password' | 'confirm-code' | any>('login')
  const onSessionCallback = React.useCallback((session: any) => {
    props.onSessionCallback?.(session)
  }, [props.onSessionCallback])

  React.useEffect(() => {
    setErrors(null)
  }, [currentTab])

  let content = null
  // support passing object with type field
  let _currentTab = currentTab?.type ? currentTab.type : currentTab
  let _currentTabProps = currentTab?.props || {}

  switch (_currentTab) {
    case 'login':
      content = <LoginForm/>
      break
    case 'signup':
      content = <SignupForm/>
      break
    case 'reset-password':
      content = <ResetPasswordForm/>
      break
    case 'confirm-code':
      content = <ConfirmWithCodeForm {..._currentTabProps}/>
      break
  }

  return (
    <AuthFormRootContext.Provider value={{
      errors, setErrors, setCurrentTab,
      onSessionCallback, userSessionRender: props.children
    }}>
      {props.titleRender?.(_currentTab, t(_currentTab))}
      <div className={'ls-authenticator-content'}>
        {content}
      </div>
    </AuthFormRootContext.Provider>
  )
}