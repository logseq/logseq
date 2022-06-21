import {
  HeadShowcase,
  LandingFooter,
  TutorialShowcase,
  TutorialTips,
} from './Landing'

export function HomePage () {
  return (
    <main className={'page-home min-h-screen'}>
      <HeadShowcase/>

      <TutorialShowcase/>
      <TutorialTips/>

      <LandingFooter/>
    </main>
  )
}
