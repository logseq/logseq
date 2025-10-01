import { Button } from '@/components/ui/button'
import { Input, InputProps } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { FormHTMLAttributes, useEffect, useState } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircleIcon, Loader2Icon, LucideEye, LucideEyeClosed } from 'lucide-react'
import { t, useAuthFormState } from './core'
import * as Auth from 'aws-amplify/auth'
import { Skeleton } from '@/components/ui/skeleton'

function ErrorTip({ error }: { error: string | { title?: string, message: string | any } }) {
  if (!error) return null
  if (typeof error === 'string') {
    error = { message: error }
  }

  return (
    <Alert variant="destructive">
      <AlertCircleIcon size={18}/>
      {error.title && <AlertTitle>{error.title}</AlertTitle>}
      <AlertDescription>
        <p>{typeof error.message === 'string' ? error.message : JSON.stringify(error.message)}</p>
      </AlertDescription>
    </Alert>
  )
}

function InputRow(
  props: InputProps & { label: string }
) {
  const { errors } = useAuthFormState()
  const { label, type, ...rest } = props
  const isPassword = type === 'password'
  const error = props.name && errors?.[props.name]
  const [localType, setLocalType] = useState<string>(type || 'text')
  const [showPassword, setShowPassword] = useState<boolean>(false)

  return (
    <div className={'relative w-full flex flex-col gap-3 pb-1'}>
      <Label htmlFor={props.id}>{label}</Label>
      <Input type={localType} {...rest as any} />

      {isPassword && (
        <a className={'absolute px-2 right-1 top-6 py-3  flex items-center opacity-50 hover:opacity-80 select-none'}
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
          <ErrorTip error={error}/>
        </div>
      }
    </div>
  )
}

function FormGroup(props: FormHTMLAttributes<any>) {
  const { className, children, ...reset } = props
  return (
    <form className={cn('flex flex-col justify-center items-center gap-4 w-full', className)}
          {...reset}>
      {children}
    </form>
  )
}

export function LoginForm() {
  const { setErrors, setCurrentTab, onSessionCallback } = useAuthFormState()
  const [loading, setLoading] = useState<boolean>(false)
  const [sessionUser, setSessionUser] = useState<any>(null)
  const loadSession = async () => {
    try {
      const ret = await Auth.fetchAuthSession()
      console.log(ret)
      if (!ret?.userSub) throw new Error('no session')
      const user = await Auth.getCurrentUser()
      onSessionCallback?.({ ...ret, user })
      setSessionUser(user)
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

  if (sessionUser?.username) {
    return (
      <div className={'w-full text-center'}>
        <p className={'mb-4'}>{t('You are already logged in as')} <strong>{sessionUser.username}</strong></p>
        <Button variant={'secondary'} className={'w-full'} onClick={async () => {
          await Auth.signOut()
          setSessionUser(false)
          setErrors(null)
        }}>{t('Sign out')}</Button>
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
            setCurrentTab({ type: 'reset', props: { user: { ...ret, username }, nextStep } })
            return
          case 'DONE':
            // signed in
            loadSession()
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
      <InputRow id="email" type="text" name="email" label={t('Email')}/>
      <InputRow id="password" type="password" name="password" label={t('Password')}/>

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
              className={'underline opacity-50 hover:opacity-80'}
            >{t('Sign up')}</a>
            <br/>
            <span className={'opacity-50'}>{t('or')} &nbsp;</span>
          </span>

          <a onClick={() => {
            setCurrentTab('reset')
          }} className={'text-sm opacity-50 hover:opacity-80 underline'}>
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

        if (data.password.length < 8) {
          setErrors({
            password: {
              message: t('Password must be at least 8 characters.'),
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
          await new Promise(resolve => { setTimeout(resolve, 500) })

          const ret = await Auth.signUp({
            username: data.username as string,
            password: data.password as string,
            options: {
              userAttributes: {
                email: data.email as string,
              }
            }
          })

          console.log(ret)
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
             className={'text-sm opacity-50 hover:opacity-80 underline'}>
            {t('Back to login')}
          </a>
        </p>
      </FormGroup>
    </>
  )
}

export function ResetPasswordForm() {
  const [isSentCode, setIsSentCode] = useState<boolean>(false)
  const { setCurrentTab } = useAuthFormState()

  return (
    <FormGroup
      autoComplete={'off'}
      onSubmit={(e) => {
        e.preventDefault()

        // get submit form input data
        const formData = new FormData(e.target as HTMLFormElement)
        const data = Object.fromEntries(formData.entries())
        console.log(data)

        setIsSentCode(true)
      }}>
      {isSentCode ? (
        <>
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
                    variant={'secondary'}
            >{t('Reset password')}</Button>

            <p className={'pt-4 text-center'}>
              <a onClick={() => setIsSentCode(false)}
                 className={'text-sm opacity-50 hover:opacity-80 underline'}>
                {t('Resend code')}
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
                    variant={'secondary'}
            >{t('Send code')}</Button>

            <p className={'pt-3 text-center'}>
              <a onClick={() => setCurrentTab('login')}
                 className={'text-sm opacity-50 hover:opacity-80 underline'}>
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

  return (
    <FormGroup
      autoComplete={'off'}
      onSubmit={async (e) => {
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

            console.log('===>>', ret)
          } else {
            const ret = await Auth.confirmSignIn({
              challengeResponse: data.code as string,
            })

            console.log('===>>', ret)
          }
        } catch (e) {
          setErrors({ code: { message: (e as Error).message, title: t('Bad Response.') } })
          console.error(e)
        } finally {
          setLoading(false)
        }
      }}>

      <p className={'pb-2 opacity-60'}>
        {isFromSignIn && t('CODE_ON_THE_WAY_TIP')}
      </p>
      <pre>
        {JSON.stringify(props.user, null, 2)}
        {JSON.stringify(props.nextStep, null, 2)}
      </pre>

      <span className={'w-full flex justify-end relative h-0 z-10'}>
        <a className={'text-sm opacity-50 hover:opacity-80 active:opacity-50 select-none underline absolute -bottom-8'}
           onClick={async (e) => {
             e.stopPropagation()
             // resend code
             try {
               setLoading(true)
               if (props.nextStep === 'CONFIRM_SIGN_UP') {
                 const ret = await Auth.resendSignUpCode({
                   username: props.user?.username
                 })

                 console.log('===>>', ret)
               } else {
                 // await Auth.resendSignInCode(props.user)
               }
             } catch (e) {
               setErrors({ code: { message: (e as Error).message, title: t('Bad Response.') } })
               console.error(e)
             } finally {
               setLoading(false)
             }
           }}>{t('Resend code')}</a>
      </span>
      <InputRow id="code" type="number" name="code" required={true}
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
             className={'text-sm opacity-50 hover:opacity-80 underline'}>
            {t('Back to login')}
          </a>
        </p>
      </div>
    </FormGroup>
  )
}