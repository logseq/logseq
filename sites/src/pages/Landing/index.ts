import './index.css'

import { HeadShowcase } from './HeadShowcase'
import { TutorialShowcase } from './TutorialShowcase'
import { TutorialTips } from './TutorialTips'
import { LandingFooterDesc, LandingFooterNav } from './LandingFooterNav'

const fullBgImageB: any = new URL('./assets/full-bg-text.png', import.meta.url)
const fullBgImageBMobile: any = new URL('./assets/full-bg-text_mobile.png', import.meta.url)

const promiseImages: any = {
  '00': new URL('./assets/promise-0-0.png', import.meta.url),
  '01': new URL('./assets/promise-0-1.png', import.meta.url),
  '10': new URL('./assets/promise-1-0.png', import.meta.url),
  '11': new URL('./assets/promise-1-1.png', import.meta.url),
  '20': new URL('./assets/promise-2-0.png', import.meta.url),
  '21': new URL('./assets/promise-2-1.png', import.meta.url),
}

export {
  HeadShowcase,
  TutorialShowcase,
  TutorialTips,
  LandingFooterNav,
  LandingFooterDesc,
  fullBgImageB,
  fullBgImageBMobile,
  promiseImages,
}
