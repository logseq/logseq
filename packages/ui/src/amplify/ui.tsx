import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function LoginForm() {
  return (
    <div className={'flex flex-col justify-center items-center gap-4 w-full'}>
      <div className={'w-full'}>
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" placeholder="Email"/>
      </div>

      <div className={'w-full'}>
        <Label htmlFor="password">Password</Label>
        <Input id="password" type="password" placeholder="Password"/>
      </div>

      <div className={'w-full'}>
        <Button type="submit">Submit</Button>
      </div>
    </div>
  )
}

export function SignupForm() {

}

export function ForgotPasswordForm() {

}

export function ResetPasswordForm() {

}