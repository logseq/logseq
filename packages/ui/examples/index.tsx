import '../src/index.css'
import { setupGlobals } from '../src/ui'
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { init, t } from '../src/amplify/core'

// @ts-ignore
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LoginForm, ResetPasswordForm, SignupForm, ConfirmWithCodeForm } from '../src/amplify/ui'
import { AuthFormRootContext } from '../src/amplify/core'

// bootstrap
setupGlobals()
init()

function App() {
  const [errors, setErrors] = React.useState<string | null>(null)
  const [currentTab, setCurrentTab] = React.useState<'login' | 'reset' | 'signup' | 'confirm-code' | any>('login')
  const onSessionCallback = React.useCallback((session: any) => {
    console.log('==>>session callback:', session)
  }, [])

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
    case 'reset':
      content = <ResetPasswordForm/>
      break
    case 'signup':
      content = <SignupForm/>
      break
    case 'confirm-code':
      content = <ConfirmWithCodeForm {..._currentTabProps}/>
      break
  }

  return (
    <main className={'h-screen flex flex-col justify-center items-center gap-4'}>
      <AuthFormRootContext.Provider value={{
        errors, setErrors, setCurrentTab,
        onSessionCallback
      }}>
        <Card className={'sm:w-96'}>
          <CardHeader>
            <CardTitle className={'capitalize'}>{t(_currentTab)?.replace('-', ' ')}</CardTitle>
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