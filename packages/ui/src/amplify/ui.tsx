import { Button } from '@/components/ui/button'
import { Input, InputProps } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { translate as t } from '../i18n'
import { cn } from '@/lib/utils'
import { FormHTMLAttributes, useState } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircleIcon, LucideEye, LucideEyeClosed } from 'lucide-react'
import { useAuthFormState } from './core'

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
    <div className={'relative w-full flex flex-col gap-2 pb-1'}>
      <Label htmlFor={props.id}>{label}</Label>
      <Input type={localType} {...rest as any} />

      {isPassword && (
        <a className={'absolute px-2 right-1 top-6 bottom-1 flex items-center opacity-50 hover:opacity-80 select-none'}
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
          <Alert variant="destructive">
            <AlertCircleIcon size={20}/>
            <AlertTitle>Input Error.</AlertTitle>
            <AlertDescription>
              <p>{JSON.stringify(error)}</p>
            </AlertDescription>
          </Alert>
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
  const { setErrors, setCurrentTab } = useAuthFormState()

  return (
    <FormGroup onSubmit={(e) => {
      e.preventDefault()

      // get submit form input data
      const formData = new FormData(e.target as HTMLFormElement)
      const data = Object.fromEntries(formData.entries())
      console.log(data)

      // TODO: error
      setErrors({ password: 'Invalid email or password' })
    }}>
      <InputRow id="email" type="email" name="email" label={t('Email')}/>
      <InputRow id="password" type="password" name="password" label={t('Password')}/>

      <div className={'w-full'}>
        <Button type="submit" className={'w-full'}>{t('submit')}</Button>
        <p className={'pt-4 text-center'}>

          <span className={'text-sm'}>
            <span className={'opacity-50'}>Don't have an account? </span>
            <a
              onClick={() => setCurrentTab('signup')}
              className={'underline opacity-50 hover:opacity-80'}
            >Sign up</a>
            <br/>
            <span className={'opacity-50'}>or &nbsp;</span>
          </span>

          <a onClick={() => {
            setCurrentTab('reset')
          }} className={'text-sm opacity-50 hover:opacity-80 underline'}>
            Forgot your password?
          </a>
        </p>
      </div>
    </FormGroup>
  )
}

export function SignupForm() {
  const { setCurrentTab } = useAuthFormState()

  return (
    <>
      <FormGroup onSubmit={(e) => {
        e.preventDefault()

        // get submit form input data
        const formData = new FormData(e.target as HTMLFormElement)
        const data = Object.fromEntries(formData.entries())
        console.log(data)
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
            {t('By signing up, you agree to our ')}
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
          <Button type="submit" className={'w-full'}>{t('Create account')}</Button>
        </div>

        <p className={'pt-2 text-center'}>
          <a onClick={() => setCurrentTab('login')}
             className={'text-sm opacity-50 hover:opacity-80 underline'}>
            Back to login
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

          <InputRow label={'Confirm Password'}
                    id="confirm_password" type="password" name="confirm_password" required={true}
                    placeholder={t('Confirm Password')}/>

          <div className={'w-full'}>
            <Button type="submit"
                    className={'w-full'}
                    variant={'secondary'}
            >{t('Reset password')}</Button>

            <p className={'pt-4 text-center'}>
              <a onClick={() => setIsSentCode(false)}
                 className={'text-sm opacity-50 hover:opacity-80 hover:underline'}>
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

            <p className={'pt-4 text-center'}>
              <a onClick={() => setCurrentTab('login')}
                 className={'text-sm opacity-50 hover:opacity-80 underline'}>
                Back to login
              </a>
            </p>
          </div>
        </>
      )}
    </FormGroup>
  )
}