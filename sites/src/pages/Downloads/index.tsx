import './index.css'
import {
  AppleLogo, AppStoreLogo, GooglePlayLogo,
  LinuxLogo, WindowsLogo
} from 'phosphor-react'
import { useState } from 'react'
import cx from 'classnames'
import { LSButton } from '../../components/Buttons'

const releases = [
  ['MacOS', <AppleLogo/>],
  ['Windows', <WindowsLogo/>],
  ['Linux', <LinuxLogo/>],
  ['iOS', <AppStoreLogo/>],
  ['Android', <GooglePlayLogo/>]
]

export function HeadDownloadLinks () {
  const [activeRelease, setActiveRelease] = useState(releases[0])

  const resolvePanel = function ([label, icon]: [string, any]) {
    switch (label) {
      case '':
      default:
        return (
          <LSButton leftIcon={icon}>
            Download {label} release
          </LSButton>
        )
    }
  }

  return (
    <div className="app-head-downloads">
      <div className="flex flex-col items-center pt-28 pb-12 text-slogan">
        <h1 className="text-6xl">
          <strong className="font-semibold tracking-wide">Download </strong>
          <span className="opacity-60">the apps.</span>
        </h1>
        <h2 className="flex flex-col justify-center items-center pt-2 tracking-wide">
          <span className="opacity-60">
            Collect your thoughts and get inspired.
          </span>
          <span className="opacity-90">
            Your train-of-thought is waiting for you!
          </span>
        </h2>
      </div>

      <div className="dl-items">
        <ul className="tabs flex flex space-x-8 justify-around">
          {releases.map(([label, icon]) => {
            return (
              <li className={cx({ active: activeRelease[0] === label })}
                  onClick={() => {
                    setActiveRelease([label, icon])
                  }}
              >
                <span className="opacity-60">
                {icon}
                </span>
                <strong>
                  {label}
                </strong>
              </li>
            )
          })}
        </ul>

        <div className="panels flex py-10 justify-center">
          {resolvePanel(activeRelease)}
        </div>
      </div>
    </div>
  )
}

export function DownloadsPage () {
  return (
    <div className="app-page">
      <div className="page-inner">
        <HeadDownloadLinks/>
      </div>
    </div>
  )
}