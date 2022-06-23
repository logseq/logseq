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
          <img src={fullBgImageB} className="w-full" alt="image"/>

          {/* text slogan  */}
          <div className="text-slogan">
            <h1
              className="text-[60px] flex flex-col justify-center text-center pb-6">
              <span className="opacity-60">Overwhelmed and constantly </span>
              <strong className="opacity-90">afraid of losing your thoughts?</strong>
            </h1>

            <h2 className="flex flex-col justify-center text-center text-2xl tracking-wide">
              <span className="opacity-60">Everyday you’re bombarded with information.</span>
              <span className="opacity-60">Your non-connected notes lead to missing context when</span>
              <strong className="font-normal">
                <span className="opacity-60">you need it. </span>
                That gets future-you into trouble.
              </strong>
            </h2>
          </div>
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
