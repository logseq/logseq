import '../src/index.css'
import { setupGlobals } from '../src/ui'
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { init } from '../src/amplify/core'

// @ts-ignore
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../@/components/ui/card'
import { LoginForm, ResetPasswordForm, SignupForm } from '../src/amplify/ui'
import { AuthFormRootContext } from '../src/amplify/core'

// bootstrap
setupGlobals()
init()

function App() {
  const [errors, setErrors] = React.useState<string | null>(null)
  const [currentTab, setCurrentTab] = React.useState<'login' | 'reset' | 'signup'>('login')

  React.useEffect(() => {
    setErrors(null)
  }, [currentTab])

  let content = null

  switch (currentTab) {
    case 'login':
      content = <LoginForm/>
      break
    case 'reset':
      content = <ResetPasswordForm/>
      break
    case 'signup':
      content = <SignupForm/>
      break
  }

  return (
    <main className={'h-screen flex flex-col justify-center items-center gap-4'}>
      <AuthFormRootContext.Provider value={{ errors, setErrors, setCurrentTab }}>
        <Card className={'sm:w-96'}>
          <CardHeader>
            <CardTitle className={'capitalize'}>{currentTab}</CardTitle>
          </CardHeader>
          <CardContent>
            {content}
          </CardContent>
        </Card>
      </AuthFormRootContext.Provider>
    </main>
  )
}

// mount app
ReactDOM.render(<App/>, document.querySelector('#app'))