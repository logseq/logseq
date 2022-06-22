import {
  AppleLogo, ArrowSquareOut, CaretDown,
  DeviceMobile,
  FileText,
  GithubLogo,
  Globe,
  HandWaving,
  Keyhole, Play,
  PuzzlePiece,
  Swatches, TwitterLogo
} from 'phosphor-react'
import { LSButton } from '../../components/Buttons'
import { AppLogo, FloatGlassButton } from './common'

export function FooterDescCard (props: any) {
  const { icon, title, desc } = props
  return (
    <div className="item p-4 pt-0">
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
  return (
    <div className="app-landing-footer-desc">
      <h1 className="text-5xl text-center py-4 block">
        <strong className="font-semibold">A safe space for </strong>
        <span className="text-gray-400/60">your thoughts.</span></h1>

      <h2 className="text-[22px] px-72 text-center">
        <span className="text-gray-400/60">Designed to store your </span>
        <strong className="font-normal">interests, questions, ideas, favorite quotes,
          reminders, reading and meeting
          notes </strong>
        <span className="text-gray-400/60">easily and future-proof:</span>
      </h2>

      {/*  descriptions */}
      <div className="cards flex">
        {[
          [<GithubLogo size={34}/>, 'Open source', 'Free forever for personal use'],
          [<Keyhole size={34}/>, 'Privacy first', 'You own your data locally forever'],
          [<DeviceMobile size={34}/>, 'Mobile apps', 'Available for iOS & Android'],
          [<FileText size={34}/>, 'Markdown files', 'Open your notes in other tools'],
          [<HandWaving size={34}/>, 'Strong community', (
            <span className="flex space-x-2 items-center">
              <i className="w-[6px] h-[6px] bg-green-600 rounded-2xl"></i>
              <span className="opacity-50">1,000 users online currently</span>
            </span>)],
          [<Globe size={34}/>, 'Localization', 'Translated in many languages'],
          [<PuzzlePiece size={34}/>, '250+ Plugins', 'Extend functionality to your needs'],
          [<Swatches size={34}/>, '70+ Themes', 'Customize look and feel'],
        ].map(([icon, title, desc]) => {
          if (typeof desc === 'string') {
            desc = (<span className="opacity-50">{desc}</span>)
          }
          return (
            <FooterDescCard icon={icon} title={title} desc={desc}/>
          )
        })}
      </div>

      {/* downloads */}
      <div className="actions">
        <h1 className="text-6xl tracking-wide">
          <span className="opacity-70">Think faster,</span>
          <strong className="font-semibold">think better!</strong>
        </h1>

        <h2 className="text-3xl text-center tracking-wide">
          <strong className="opacity-50 font-normal">By thinking and writing with Logseq, you'll </strong><br/>
          <span className="">gain confidence in what you know and <br/>
            stop worrying about forgetting </span>
          <strong className={'opacity-50 font-normal'}>anything</strong>.
        </h2>

        <div className="actions-4 flex space-x-4 pt-10 pb-1">
          <LSButton
            leftIcon={<AppleLogo size={18} weight={'bold'}/>}
            rightIcon={<CaretDown size={18} className={'opacity-70'}/>}
          >
            Download for Mac
          </LSButton>

          <LSButton
            leftIcon={<Play size={18} weight={'bold'}/>}
            rightIcon={<ArrowSquareOut size={18} className={'opacity-70'}/>}
            className={'bg-logseq-600'}
          >
            Live Demo
          </LSButton>
        </div>
      </div>
    </div>
  )
}

export function LandingFooterNav () {
  return (
    <div className="app-landing-footer-navs">
      <div className="flex space-x-4">
        <AppLogo/>

        <div className="flex flex-col justify-center">
          <p className="flex space-x-4 text-xs text-gray-300/90">
            <a href="">Privacy</a>
            <a href="">Terms</a>
            <a href="">Contact Us</a>
          </p>
          <p className="text-xs opacity-40 py-1">
            © 2022 Logseq, Inc.
          </p>
        </div>
      </div>

      <div className="flex space-x-3">
        <FloatGlassButton>
          <GithubLogo/>
        </FloatGlassButton>

        <FloatGlassButton>
          <TwitterLogo />
        </FloatGlassButton>
      </div>
    </div>
  )
}
