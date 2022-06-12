import React from 'react'
import ReactDOM from 'react-dom'
import 'tldraw-logseq/styles.css'

import App from './App'

import './index.css'

// Not using strict mode because it may cause side effect problems
// https://twitter.com/schickling/status/1523378971458498560
ReactDOM.render(<App />, document.getElementById('root'))
