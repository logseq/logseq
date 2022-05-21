import React from 'react'
import ReactDOM from 'react-dom/client'
import 'tldraw-logseq/dist/index.css'

import App from './App'

import './index.css'

// Not using strict mode because it may cause side effect problems
// https://twitter.com/schickling/status/1523378971458498560
ReactDOM.createRoot(document.getElementById('root')).render(<App />)
