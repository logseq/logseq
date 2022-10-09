import './index.css'
import {
  AppleLogo, AppStoreLogo, CaretDown, DownloadSimple, GooglePlayLogo,
  LinuxLogo, QrCode, WindowsLogo,
} from 'phosphor-react'
import { useEffect, useRef, useState } from 'react'
import cx from 'classnames'
import { Button } from '../../components/Buttons'
import { LandingFooterDesc, LandingFooterNav } from '../Landing'
import { useAppState } from '../../state'

const iosImageQr: any = new URL('assets/ios_app_qr.png', import.meta.url)
const intelImageIcon: any = new URL('assets/icon_intel.png', import.meta.url)
const M1ImageIcon: any = new URL('assets/icon_m1.png', import.meta.url)
const WindowsImageIcon: any = new URL('assets/icon_windows_64.png',
  import.meta.url)
const LinuxImageIcon: any = new URL('assets/icon_linux.png', import.meta.url)
const GooglePlayImageIcon: any = new URL('assets/icon_google_play.png',
  import.meta.url)
const AppleImageIcon: any = new URL('assets/icon_apple.png', import.meta.url)

const releaseImages: any = {
  'macos': new URL('assets/p_macos.png', import.meta.url),
  'windows': new URL('assets/p_windows.png', import.meta.url),
  'linux': new URL('assets/p_linux.png', import.meta.url),
  'ios': new URL('assets/p_ios.png', import.meta.url),
  'android': new URL('assets/p_android.png', import.meta.url),
}

const IntelIcon = (props: any) => {
  const { className, ...rest } = props

  return (
    <span className={cx(
      'color-icon flex rounded overflow-hidden items-center justify-center',
      className)} {...rest}>
      <img src={intelImageIcon} className={'w-4/5'} alt="intel"/>
    </span>
  )
}

const M1Icon = (props: any) => {
  const { className, ...rest } = props

  return (
    <span className={cx(
      'color-icon flex rounded overflow-hidden items-center justify-center',
      className)} {...rest}>
      <img src={M1ImageIcon} className={'w-4/5'} alt="M1"/>
    </span>
  )
}

const AppleIcon = (props: any) => {
  const { className, ...rest } = props

  return (
    <span className={cx(
      'color-icon flex rounded overflow-hidden items-center justify-center',
      className)} {...rest}>
      <img src={AppleImageIcon} className={'w-4/5'} alt="GooglePlay"/>
    </span>
  )
}

const Windows64Icon = (props: any) => {
  const { className, ...rest } = props

  return (
    <span className={cx(
      'color-icon flex rounded overflow-hidden items-center justify-center',
      className)} {...rest}>
      <img src={WindowsImageIcon} className={'w-4/5'} alt="Windows64"/>
    </span>
  )
}
const LinuxIcon = (props: any) => {
  const { className, ...rest } = props

  return (
    <span className={cx(
      'color-icon flex rounded overflow-hidden items-center justify-center',
      className)} {...rest}>
      <img src={LinuxImageIcon} className={'w-4/5'} alt="GooglePlay"/>
    </span>
  )
}

const GooglePlayIcon = (props: any) => {
  const { className, ...rest } = props

  return (
    <span className={cx(
      'color-icon flex rounded overflow-hidden items-center justify-center',
      className)} {...rest}>
      <img src={GooglePlayImageIcon} className={'w-4/5'} alt="GooglePlay"/>
    </span>
  )
}

const releases = [
  ['MacOS', (props = {}) => <AppleLogo {...props} weight={'duotone'}/>],
  ['Windows', (props = {}) => <WindowsLogo {...props} weight={'duotone'}/>],
  ['Linux', (props = {}) => <LinuxLogo {...props} weight={'duotone'}/>],
  ['iOS', (props = {}) => <AppStoreLogo {...props} weight={'duotone'}/>],
  ['Android', (props = {}) => <GooglePlayLogo {...props} weight={'duotone'}/>],
]

const downloadHandler = (
  appState: any,
  item: typeof releases[number],
  isIOS: boolean,
  platform: string = ''
) => {
  const rollback =
    isIOS ? 'https://apps.apple.com/us/app/logseq/id1601013908' :
      `https://github.com/logseq/logseq/releases`

  const downloads: any = appState.releases.downloads.get()

  platform = platform || item?.[0].toString().toLowerCase()

  if (!downloads?.[platform]) {
    return window?.open(rollback, '_blank')
  }

  window?.open(
    downloads[platform]?.browser_download_url,
    '_blank',
  )
}

export function WrapGlobalDownloadButton (
  props: any = {},
) {
  const { className, children, ...rest } = props
  const appState = useAppState()
  const wrapElRef = useRef<HTMLDivElement>(null)
  const os = appState.get().os
  const [active, setActive] = useState(releases[0])

  const isIOS = active?.[0] === 'iOS'
  const isMacOS = active?.[0] === 'MacOS'

  const rightIconFn = isMacOS ? (
    (props: any = {}) => <CaretDown className={'ml-1 opacity-60'} {...props}/>
  ) : (isIOS ? (
    (props: any = {}) => (
      appState.sm.get() ?
        <DownloadSimple weight={'duotone'} className={'ml-1 opacity-60'} {...props} /> :
        <QrCode weight={'duotone'} className={'ml-1 opacity-60'} {...props}/>)
  ) : null)

  useEffect(() => {
    releases.some((it) => {
      if (
        os[it?.[0].toString().toLowerCase()]
      ) {
        setActive(it)
        return true
      }
    })
  }, [os])

  const subItems = isMacOS ? (
    <div className="sub-items flex flex-col absolute top-5 right-0 w-full pt-6">
      <div className="sub-items-inner">
        <div className="flex items-center">
          <div className="flex pr-2">
            <IntelIcon className={'bg-black w-8 h-8'}/>
          </div>

          <div
            className={'w-full flex flex-col opacity-80'}
            onClick={(e) => {
              downloadHandler(appState, active, isIOS, 'macos-x64')
            }}
          >
            <span className="text-sm">
              Intel chip
            </span>
            <span className="text-[11px] opacity-60">
              Most common in Macs
            </span>
          </div>
        </div>

        <div className="flex items-center">
          <div className="flex pr-2">
            <M1Icon className={'bg-black w-8 h-8'}/>
          </div>

          <div
            className={'w-full flex flex-col opacity-80'}
            onClick={(e) => {
              downloadHandler(appState, active, isIOS, 'macos-x64')
            }}
          >
            <span className="text-sm">
              Apple silicon
            </span>
            <span className="text-[11px] opacity-60">
              Macs from november 2020 and later
            </span>
          </div>

        </div>
      </div>
    </div>
  ) : (isIOS ? (
      <span
        className="sub-items absolute top-6 right-2 z-10 flex justify-center translate-x-4 transition-opacity qr">
         <img src={iosImageQr} alt="qr" className="w-3/4"/>
        </span>
    ) : null
  )

  const activePlatformIcon = active?.[1]

  return (
    <div className={cx('global-downloads-wrap', className)}
         onClick={() => downloadHandler(appState, active, isIOS)}
         ref={wrapElRef}
    >
      {children({
        active,
        leftIconFn: typeof activePlatformIcon === 'function'
          ? activePlatformIcon
          : () => activePlatformIcon,
        rightIconFn,
      })}

      {subItems}
    </div>
  )
}

export function HeadDownloadLinksSelect (
  props: { activeRelease: any, setActiveRelease: any }
) {
  const { activeRelease, setActiveRelease } = props
  const activeLabel = activeRelease?.[0]

  let activeIcon = activeRelease?.[1]

  if (typeof activeIcon === 'function') {
    activeIcon = activeIcon()
  }

  return (
    <div className={cx('selects', `active-of-${activeLabel?.toLowerCase()}`)}>
      <div className="app-form-select-wrap">
        <span className="icon">
          {activeIcon}
        </span>

        <select className={'app-form-select w-full'}
                onChange={(e) => {
                  const item = releases.find(it => {
                    return it[0] === e.target.value
                  })

                  setActiveRelease(item)
                }}
                value={activeLabel}
        >
          {releases.map(([label]: any) => {
            return (
              <option
                key={label}
                value={label}>
                {label}
              </option>
            )
          })}
        </select>

        <span className="arrow">
          <CaretDown weight={'bold'}/>
        </span>
      </div>
    </div>
  )
}

export function HeadDownloadLinksTabs (
  props: { activeRelease: any, setActiveRelease: any }
) {
  const { activeRelease, setActiveRelease } = props

  return (
    <ul className="tabs flex flex space-x-8 justify-around">
      {releases.map(([label, icon]: any) => {
        if (typeof icon === 'function') {
          icon = icon()
        }

        return (
          <li className={cx({ active: activeRelease[0] === label },
            `is-${(label as string).toLowerCase()}`)}
              onClick={() => {
                setActiveRelease([label, icon])
              }}
              key={label}
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
  )
}

export function HeadDownloadLinks () {
  const appState = useAppState()
  const os = appState.get().os
  const isSm = appState.sm.get()

  let active = releases[0]

  releases.some((it) => {
    if (
      os[it?.[0].toString().toLowerCase()]
    ) {
      active = it
      return true
    }
  })

  const [activeRelease, setActiveRelease] = useState(active)

  const _downloadHandler = (platform: string) => {
    const isIOS = platform === 'ios'
    const item: any = releases.find(it => {
      return (it[0] as string).toLowerCase() === platform
    })

    downloadHandler(appState, item, isIOS, platform)
  }

  const resolvePanel = function ([label, icon]: [string, any]) {
    const isWindows = label.toLowerCase() === 'windows'
    const isAndroid = label.toLowerCase() === 'android'
    const isLinux = label.toLowerCase() === 'linux'
    const isIOS = label.toLowerCase() === 'ios'

    icon = isWindows ? (
      <Windows64Icon className="bg-black/50 w-6 h-6 sm:w-8 sm:h-8"/>
    ) : (isAndroid ?
      <GooglePlayIcon className="bg-black/50 w-6 h-6 sm:w-8 sm:h-8"/>
      : (isLinux ?
        <LinuxIcon className="bg-black/50 w-6 h-6 sm:w-8 sm:h-8"/> :
        (isIOS ? (
          <AppleIcon className="bg-black/50 w-6 h-6 sm:w-8 sm:h-8"/>
        ) : icon)))

    switch (label) {
      case 'iOS':
        return (
          <div className="w-full sm:w-auto flex flex-col items-center is-ios cursor-crosshair">
            <Button
              className={'w-full bg-logseq-400 px-3 py-3 sm:px-6 sm:py-4'}
              leftIcon={icon}
              disabled={!isSm}
              rightIcon={isSm ? <DownloadSimple className="opacity-50"/> : <QrCode className="opacity-50"/>}
              onClick={() => _downloadHandler('ios')}
            >
              Download on the App Store
            </Button>

            <span
              className="absolute top-16 z-10 flex justify-center translate-x-4 transition-opacity qr opacity-0">
              <img src={iosImageQr} alt="qr" className="w-1/2"/>
            </span>
          </div>
        )
      case 'MacOS':
        return (
          <div className="w-full sm:w-auto sm:flex sm:space-x-6">
            <div className="flex flex-col items-center">
              <Button
                className={'w-full bg-logseq-400 px-3 py-3 sm:px-6 sm:py-4'}
                leftIcon={<IntelIcon className={'w-6 h-6 sm:w-8 sm:h-8 bg-gray-900'}
                                     color={'white'}/>}
                rightIcon={<DownloadSimple className="opacity-50"/>}
                onClick={() => _downloadHandler('macos-x64')}
              >
                Download for Intel chip
              </Button>
              <span className="text-xs opacity-60 py-2">
               Most common in Macs
             </span>
            </div>

            <div className="flex flex-col items-center">
              <Button
                className={'w-full bg-logseq-600 px-3 py-3 sm:px-6 sm:py-4'}
                leftIcon={<M1Icon className={'w-6 h-6 sm:w-8 sm:h-8 bg-gray-900'}
                                  color={'white'}/>}
                rightIcon={<DownloadSimple className="opacity-50"/>}
                onClick={() => _downloadHandler('macos-arm64')}
              >
                Download for Apple silicon
              </Button>
              <span className="text-xs opacity-60 py-2">
                Macs from November 2020 and later
             </span>
            </div>
          </div>
        )
      default:
        return (
          <div className={'w-full sm:w-auto'}>
            <Button
              leftIcon={icon}
              rightIcon={<DownloadSimple className="opacity-50"/>}
              className="w-full bg-logseq-600 px-3 py-3 sm:px-6 sm:py-4"
              onClick={() => _downloadHandler(label.toString().toLowerCase())}
            >
              Download {label} release
            </Button>
          </div>
        )
    }
  }

  return (
    <div className="app-head-downloads">
      <div className="flex flex-col pt-10 sm:items-center sm:pt-20 pb-12 text-slogan">
        <h1 className="text-3xl sm:text-6xl">
          <strong className="font-semibold tracking-wide">Download </strong>
          <span className="text-logseq-50/80">the apps.</span>
        </h1>

        <h2
          className="text-xl flex flex-col justify-center sm:items-center pt-2 tracking-wide">
          <span className="text-logseq-50/80">
            Collect your thoughts and get inspired.
          </span>
          <span className="opacity-90">
            Your train-of-thought is waiting for you!
          </span>
        </h2>
      </div>

      <div className="dl-items">
        {/* Tabs/Select */}
        {appState.sm.get() ?
          <HeadDownloadLinksSelect
            activeRelease={activeRelease}
            setActiveRelease={setActiveRelease}
          /> :
          <HeadDownloadLinksTabs
            activeRelease={activeRelease}
            setActiveRelease={setActiveRelease}
          />
        }

        {/* Panels */}
        <div className="panels flex sm:justify-center pt-6 pb-0 sm:pb-10 sm:pt-10">
          {resolvePanel(activeRelease as any)}
        </div>
      </div>

      <div className="screen-shot sm:-mt-10">
        <div className="pt-4 -m-5 sm:m-0 sm:pt-0 sm:mx-24 relative overflow-hidden">
          <img alt="Image"
               src={releaseImages[activeRelease[0].toString().toLowerCase()]}
               className="sm:opacity-90 sm:translate-y-28 rounded-md overflow-hidden sm:-mt-24 img-bg"
          />
        </div>
      </div>
    </div>
  )
}

export function DownloadsPage () {
  return (
    <div className="app-page">
      <div className="page-inner-full-wrap dl-a">
        <div className="page-inner">
          <HeadDownloadLinks/>
        </div>
      </div>

      <div className="page-inner-full-wrap b relative">
        {/* particles background */}
        {/*<div id="particles-bg" className="particles-bg"></div>*/}

        <div className="page-inner footer-desc pt-16">
          <LandingFooterDesc downloadsPage={true}/>
        </div>

        <div className="page-inner footer-nav">
          <div className="page-inner">
            <LandingFooterNav/>
          </div>
        </div>
      </div>
    </div>
  )
}
