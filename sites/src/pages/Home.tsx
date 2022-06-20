import { HeadShowcase } from './Landing/HeadShowcase'
import { TutorialShowcase } from './Landing/TutorialShowcase'

export function HomePage () {
  return (
    <div className={'page-home min-h-screen'}>
      <HeadShowcase/>

      <TutorialShowcase />
    </div>
  )
}
