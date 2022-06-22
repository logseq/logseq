import { Route, Routes } from 'react-router-dom'
import { HomePage } from './pages/Home'
import { DownloadsPage } from './pages/Downloads'
import { Headbar } from './components/Headbar'

export function App () {
  return (
    <div id="app" className={'flex justify-center'}>
      <div className="app-container">
        <Headbar/>

        <Routes>
          <Route path={'/'} element={<HomePage/>}/>
          <Route path={'/downloads'} element={<DownloadsPage/>}/>
        </Routes>
      </div>
    </div>
  )
}
