import {
  fullBgImageB,
  HeadShowcase, LandingFooterDesc,
  LandingFooterNav,
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

      <div className="page-inner-full-wrap b">
        <div className="page-inner">
          <LandingFooterDesc/>
        </div>
      </div>

      <div className="page-inner">
        <LandingFooterNav/>
      </div>
    </main>
  )
}
