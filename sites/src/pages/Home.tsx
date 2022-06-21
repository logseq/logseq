import { HeadShowcase, TutorialShowcase } from './Landing'

export function HomePage () {
  return (
    <div className={'page-home min-h-screen'}>
      <HeadShowcase/>

      <TutorialShowcase />
    </div>
  )
}
