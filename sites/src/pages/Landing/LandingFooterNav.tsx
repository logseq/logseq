import {
  AppleLogo, ArrowSquareOut, CaretDown,
  DeviceMobile,
  FileText,
  GithubLogo,
  Globe,
  HandWaving,
  Keyhole, LinkSimple, Play,
  PuzzlePiece,
  Swatches, TwitterLogo
} from 'phosphor-react'
import { Button } from '../../components/Buttons'
import { AppLogo, FloatGlassButton, imageProductHuntLogo } from './common'
import { WrapGlobalDownloadButton } from '../Downloads'
import { useAppState } from '../../state'

export function FooterDescCard (props: any) {
  const { icon, title, desc } = props
  return (
    <div className="item pb-4 sm:p-4">
      <div className="inner flex opacity-90">
        <div className="w-[40px] h-[40px] flex items-center justify-center">
          {icon}
        </div>

        <div className="flex-1 pl-2">
          <h2 className="text-sm font-semibold">{title}</h2>
          <h3 className="text-xs pt-1">{desc}</h3>
        </div>
      </div>
    </div>
  )
}

export function LandingFooterDesc () {
  const appState = useAppState()

  return (
    <div className="app-landing-footer-desc">
      <h1 className="text-4xl -mt-[230px] leading-9 pb-2 sm:mt-0 sm:text-6xl sm:text-center sm:py-10">
        <strong className="font-semibold">A safe space for </strong>
        <span className="text-gray-400/60">your thoughts.</span>
      </h1>

      <h2 className="text-lg sm:text-[24px] sm:px-60 sm:text-center">
        <span className="text-gray-400/60">Designed to store your </span>
        <strong className="font-normal">interests, questions, ideas, favorite quotes,
          reminders, reading and meeting
          notes </strong>
        <span className="text-gray-400/60">easily and future-proof:</span>
      </h2>

      {/*  descriptions */}
      <div className="cards">
        {[
          [<GithubLogo size={34} weight={'duotone'}/>, 'Open source', 'Free forever for personal use'],
          [<Keyhole size={34} weight={'duotone'}/>, 'Privacy first', 'You own your data locally forever'],
          [<DeviceMobile weight={'duotone'} size={34}/>, 'Mobile apps', 'Available for iOS & Android'],
          [<FileText size={34} weight={'duotone'}/>, 'Markdown files', 'Open your notes in other tools'],
          [<HandWaving size={34} weight={'duotone'}/>, 'Strong community', (
            <span className="flex space-x-2 items-center">
              <i className="w-[6px] h-[6px] bg-green-600 rounded-2xl"></i>
              <span className="opacity-50">{appState.discord?.approximate_presence_count.get() || '-'} users online currently</span>
            </span>)],
          [<Globe size={34} weight={'duotone'}/>, 'Localization', 'Translated in many languages'],
          [<PuzzlePiece size={34} weight={'duotone'}/>, '250+ Plugins', 'Extend functionality to your needs'],
          [<Swatches size={34} weight={'duotone'}/>, '70+ Themes', 'Customize look and feel'],
        ].map(([icon, title, desc]) => {
          if (typeof desc === 'string') {
            desc = (<span className="opacity-50">{desc}</span>)
          }
          return (
            <FooterDescCard key={title} icon={icon} title={title} desc={desc}/>
          )
        })}
      </div>

      {/* downloads */}
      <div className="actions">
        <h1 className="text-4xl leading-9 sm:leading-normal sm:text-6xl tracking-wide">
          <span className="opacity-70">Think faster,</span>
          <strong className="font-semibold">think better!</strong>
        </h1>

        <h2 className="text-lg mt-2 sm:mt-0 sm:text-3xl sm:text-center sm:tracking-wide">
          <strong className="opacity-50 font-normal">By thinking and writing with Logseq, you'll </strong><br/>
          <span className="">gain confidence in what you know and <br/>
            stop worrying about forgetting </span>
          <strong className={'opacity-50 font-normal'}>anything</strong>.
        </h2>

        <div className="actions-4 sm:flex sm:space-x-4 pt-10 pb-1">
          <WrapGlobalDownloadButton
            className="is-super-button"
          >
            {({ active, leftIconFn, rightIconFn }: any) => {
              const leftIcon = leftIconFn?.({ weight: 'bold', size: 18 })
              const rightIcon = rightIconFn?.({ size: 18 })

              return (
                <Button
                  leftIcon={leftIcon}
                  rightIcon={rightIcon}
                  className={'w-full sm:w-auto'}
                >
                  Download for {active?.[0]}
                </Button>
              )
            }}
          </WrapGlobalDownloadButton>

          <Button
            leftIcon={<Play size={18} weight={'duotone'}/>}
            rightIcon={<ArrowSquareOut size={18} className={'opacity-70'}/>}
            className={'w-full bg-logseq-600 mt-4 sm:w-auto sm:mt-0'}
          >
            Live Demo
          </Button>
        </div>
      </div>
    </div>
  )
}

export function LandingFooterNav () {
  const appState = useAppState()

  const links = (
    <div className="links flex flex-col justify-center">
      <p className="flex space-x-4 text-xs text-gray-300/90 pb-1">
        <a href="https://docs.logseq.com/#/page/Privacy%20Policy" target="_blank">Privacy</a>
        <a href="https://docs.logseq.com/#/page/Terms" target="_blank">Terms</a>
        <a href="mailto:hi@logseq.com">Contact Us</a>
      </p>
      <p className="text-xs opacity-40 py-1">
        © 2022 Logseq, Inc.
      </p>
    </div>
  )

  return (
    <div className="app-landing-footer-navs">
      <div className="flex flex-1 justify-between">
        <div className="flex space-x-4">
          <AppLogo className="w-16 h-16"/>

          {appState.sm.get() ? null : links}
        </div>

        <div className="flex space-x-4 pl-[14px] py-[8px] sm:pr-[14px]">
          <FloatGlassButton
            href="https://github.com/logseq/logseq"
            className={'!px-3'}
          >
            <GithubLogo size={26} weight={'duotone'}/>
          </FloatGlassButton>

          <FloatGlassButton
            href="https://twitter.com/logseq"
            className={'!px-3'}
          >
            <TwitterLogo size={26} weight={'duotone'}/>
          </FloatGlassButton>
        </div>
      </div>

      <div className="pt-4 sm:pt-0 sm:flex sm:space-x-4">
        <Button
          leftIcon={<img className="w-10" src={imageProductHuntLogo} alt="image"/>}
          rightIcon={<ArrowSquareOut className="opacity-50"/>}
          className="w-full py-1 px-2 bg-transparent border-2 border-logseq-400"
          href="https://www.producthunt.com/products/logseq"
        >
          <span className="opacity-90">
            Review us on ProductHunt
          </span>
        </Button>
      </div>

      {appState.sm.get() ? links : null}
    </div>
  )
}
