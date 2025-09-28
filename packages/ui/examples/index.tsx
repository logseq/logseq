import '../src/index.css'
import { setupGlobals } from '../src/ui'
import * as React from 'react'
import * as ReactDOM from 'react-dom'

// @ts-ignore
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../@/components/ui/card'
import { LoginForm } from '../src/amplify/ui'

// bootstrap
setupGlobals()

function App() {
  return (
    <main className={'pt-72 flex flex-col justify-center items-center gap-4'}>
      <h1 className={'text-green-900 mb-8 font-bold text-4xl'}>
        Hello, Logseq UI :)
      </h1>

      <Card className={'sm:w-80'}>
        <CardHeader>
          <CardTitle>Login</CardTitle>
        </CardHeader>
        <CardContent>
          <LoginForm/>
        </CardContent>
      </Card>
    </main>
  )
}

// mount app
ReactDOM.render(<App/>, document.querySelector('#app'))