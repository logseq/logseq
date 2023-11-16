import 'src/index.css'
import { setupGlobals } from '../src'
import * as React from 'react'
import * as ReactDOM from 'react-dom'

// @ts-ignore
import { Button } from '@/components/ui/button'

// bootstrap
setupGlobals()

function App() {
  return (
    <main className={'p-8'}>
      <h1 className={'text-red-500 mb-8'}>
        Hello, Logseq UI :)
      </h1>
      <Button asChild>
        <a href={'https://google.com'} target={'_blank'}>go to google.com</a>
      </Button>
    </main>
  )
}

// mount app
ReactDOM.render(<App/>, document.querySelector('#app'))