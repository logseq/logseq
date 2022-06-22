import {
  fullBgImageB,
  HeadShowcase,
  LandingFooter,
  TutorialShowcase,
  TutorialTips,
} from './Landing'

export function HomePage () {
  return (
    <main className={'page-home min-h-screen'}>
      <div className="page-inner">
        <HeadShowcase/>
        <TutorialShowcase/>
        <TutorialTips/>
      </div>

      <div className="page-inner-full-wrap a">
        <div className="page-inner">
          <img src={fullBgImageB} alt="image"/>
        </div>
      </div>

      <div className="page-inner">
        <LandingFooter/>
      </div>
    </main>
  )
}
