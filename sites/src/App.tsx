import { Route, Routes } from 'react-router-dom'
import { HomePage } from './pages/Home'
import { DownloadsPage } from './pages/Downloads'
import { Headbar } from './components/Headbar'
import {
  checkSmBreakPoint,
  useAppState,
  useDiscordState,
  useReleasesState,
} from './state'
import { useEffect } from 'react'
import { PrivacyBanner } from './components/PrivacyBanner'
import { Toaster } from 'react-hot-toast'

export function App () {
  const appState = useAppState()

  // load global state
  useReleasesState()
  useDiscordState()

  useEffect(() => {
    const resizeHandler = () => {
      appState.sm.set(
        checkSmBreakPoint(),
      )
    }

    window.addEventListener('resize', resizeHandler)
    return () => {
      window.removeEventListener('resize', resizeHandler)
    }
  }, [])

  return (
    <div id="app" className={'flex justify-center'}>
      <Toaster
        position={'top-right'}
        toastOptions={{
          className: 'app-toaster',
        }}
      />

      <div className="app-container">
        <Headbar/>

        <Routes>
          <Route path={'/'} element={<HomePage/>}/>
          <Route path={'/downloads'} element={<DownloadsPage/>}/>
        </Routes>

        <PrivacyBanner/>
      </div>
    </div>
  )
}
