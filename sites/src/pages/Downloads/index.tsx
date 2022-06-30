import './index.css'
import {
  AppleLogo, AppStoreLogo, DownloadSimple, GooglePlayLogo,
  LinuxLogo, QrCode, WindowsLogo
} from 'phosphor-react'
import { useEffect, useState } from 'react'
import cx from 'classnames'
import { LSButton } from '../../components/Buttons'
import { IconsIntel } from '../../components/Icons'
import { LandingFooterDesc, LandingFooterNav } from '../Landing'

const headImageBg: any = new URL('assets/dl_head_bg.jpg', import.meta.url)
const headImagePhone: any = new URL('assets/dl_head_bg_2.png', import.meta.url)
const iosImageQr: any = new URL('assets/ios_app_qr.png', import.meta.url)

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
      case 'iOS':
        return (
          <div className="flex flex-col items-center is-ios cursor-crosshair">
            <LSButton
              className={'bg-logseq-400 px-6 py-4'}
              leftIcon={icon}
              disabled={true}
              rightIcon={<QrCode className="opacity-50"/>}
            >
              Download on the App Store
            </LSButton>

            <span className="absolute top-16 z-10 flex justify-center translate-x-4 transition-opacity qr opacity-0">
              <img src={iosImageQr} alt="qr" className="w-1/2"/>
            </span>
          </div>
        )
      case 'MacOS':
        return (
          <div className="flex space-x-6">
            <div className="flex flex-col items-center">
              <LSButton
                className={'bg-logseq-400 px-6 py-4'}
                leftIcon={<IconsIntel size={26} color={'white'}/>}
                rightIcon={<DownloadSimple className="opacity-50"/>}
              >
                Download for Intel chip
              </LSButton>
              <span className="text-xs opacity-60 py-2">
               Most common in Macs
             </span>
            </div>

            <div className="flex flex-col items-center">
              <LSButton
                className={'bg-logseq-600 px-6 py-4'}
                leftIcon={<AppleLogo size={24} color={'white'}/>}
                rightIcon={<DownloadSimple className="opacity-50"/>}
              >
                Download for Apple chip
              </LSButton>
              <span className="text-xs opacity-60 py-2">
                Macs from November 2020 and later
             </span>
            </div>
          </div>
        )
      default:
        return (
          <div>
            <LSButton
              leftIcon={icon}
              rightIcon={<DownloadSimple className="opacity-50"/>}
              className="bg-logseq-600 px-6 py-4"
            >
              Download {label} release
            </LSButton>
          </div>
        )
    }
  }

  return (
    <div className="app-head-downloads">
      <div className="flex flex-col items-center pt-20 pb-12 text-slogan">
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
              <li className={cx({ active: activeRelease[0] === label }, `is-${(label as string).toLowerCase()}`)}
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
          {resolvePanel(activeRelease as any)}
        </div>
      </div>

      <div className="screen-shot">
        <div className="img-wrap mx-24 relative overflow-hidden">
          <img alt="Image"
               src={headImageBg}
               className="opacity-80 translate-y-28 rounded-md overflow-hidden -mt-24 img-bg"
          />

          <img alt="Image"
               src={headImagePhone}
               className="opacity-90 absolute -right-20 -bottom-16 w-[380px]
               animate-in duration-1000 slide-in-from-right-40 fade-in-0"
          />
        </div>
      </div>
    </div>
  )
}

export function DownloadsPage () {
  useEffect(() => {
    setTimeout(() => {
      // @ts-ignore
      particlesJS.load('particles-bg', './particlesjs-config.json', () => {
      })
    }, 1000)
  }, [])

  return (
    <div className="app-page">
      <div className="page-inner-full-wrap dl-a">
        <div className="page-inner">
          <HeadDownloadLinks/>
        </div>
      </div>

      <div className="page-inner-full-wrap b relative">
        {/* particles background */}
        <div id="particles-bg" className="particles-bg"></div>

        <div className="page-inner pt-32">
          <LandingFooterDesc/>
        </div>
      </div>

      <div className="page-inner pt-0">
        <LandingFooterNav/>
      </div>
    </div>
  )
}