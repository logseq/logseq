import { useEffect, useRef, useState } from 'react'
import cx from 'classnames'
import { FloatGlassButton, openLightbox } from './common'
import { ArrowSquareOut, CaretDown, DiscordLogo, FrameCorners, TwitterLogo } from 'phosphor-react'
import { AnimateInTurnStage } from '../../components/Animations'
import { useAppState } from '../../state'

const IconImageRelations = new URL('assets/icon_relations.png', import.meta.url)
const IconImageDailyPlan = new URL('assets/icon_daily_plan.png', import.meta.url)
const IconImageJournals = new URL('assets/icon_journals.png', import.meta.url)
const IconImageDataControl = new URL('assets/icon_data_control.png', import.meta.url)

const showcases = [
  {
    label: 'Relationships',
    iconUrl: IconImageRelations,
    descImgUrl: new URL('./assets/benefit-0.png', import.meta.url),
    refLink: 'https://discord.com/channels/725182569297215569/725188616695054356/1045646531090448436',
    userName: 'oskr',
    refType: 'discord',
    desc: (
      <p>
        Communicate better. <span className="opacity-60">Stay on top of your <br/>relationships, conversations, and meetings.</span>
      </p>),
    feedback: (
      <p>
        <span>“I mostly use it for work: keeping </span>daily notes & meeting notes. It's the best solution I've found
        to managing my tasks
        <span>(and I only use a fraction of the features there).”</span>
      </p>
    )
  },
  {
    label: 'Daily Plan',
    iconUrl: IconImageDailyPlan,
    descImgUrl: new URL('./assets/benefit-1.png', import.meta.url),
    refLink: 'https://discord.com/channels/725182569297215569/918889676071374889/1050520429258887320',
    refType: 'discord',
    userName: 'breadchris',
    desc: (
      <p>
        <span>Channel your attention,</span>
        reduce stress.
      </p>),
    feedback: (
      <p>
        <span>“I used to hate taking notes.</span>
        If I told my past self that I wouldn't just like taking notes, but that I would become addicted to it, I
        wouldn't believe it.
        <span>Logseq has changed my life 🔥🔥🔥”</span>
      </p>
    )
  },
  {
    label: 'Journaling',
    iconUrl: IconImageJournals,
    descImgUrl: new URL('./assets/benefit-2.png', import.meta.url),
    refLink: 'https://discord.com/channels/725182569297215569/766475028978991104/965786173148627044',
    refType: 'discord',
    userName: 'Kiernan',
    desc: (
      <p>
        Understand yourself better.
      </p>),
    feedback: (
      <p>
        “Before Logseq, I didn't use to write a daily journal, now I feel that it has a great value!”
      </p>
    )
  },
  {
    label: 'Data Control',
    iconUrl: IconImageDataControl,
    descImgUrl: new URL('./assets/benefit-3.png', import.meta.url),
    refLink: 'https://twitter.com/15777984/status/1522601138738151427',
    userName: '@b05crypto',
    desc: (
      <p>
        <span>Do all this without lock-in.</span> <br/>
        And without risking your privacy.
      </p>),
    feedback: (
      <p>
        <span>“Logseq does tracking everything in my life </span>
        better than any tool I've ever used, including Roam and I have control of my data.”
      </p>
    )
  }
]

export function DailyShowcaseTabs(
  props: { activeShowcase: string, setActiveShowcase: any }
) {
  const { activeShowcase, setActiveShowcase } = props

  return (<div className="tabs flex justify-between space-x-8 px-6">
    {showcases.map(it => {
      return (
        <div className={cx('it flex flex-col flex-1', { active: it.label === activeShowcase })}
             key={it.label}
             onClick={() => {
               setActiveShowcase(it.label)
             }}
        >
              <span className="icon">
                <img src={it.iconUrl as any} alt={it.label}/>
              </span>
          <strong className="pt-2.5 font-normal text-[20px] opacity-60 tracking-wide">
            {it.label}
          </strong>
        </div>
      )
    })}
  </div>)
}

export function DailyShowcaseSelect(
  props: { activeShowcase: string, setActiveShowcase: any }
) {
  const { activeShowcase, setActiveShowcase } = props
  const activeIndex: number = showcases.findIndex(it => it.label === activeShowcase)
  const activeItem: any = showcases[activeIndex]

  return (
    <div className={cx('selects', `index-of-${activeIndex}`)}>
      <div className={'app-form-select-wrap'}>
        <span className="icon">
          <img alt={activeItem.label} src={activeItem.iconUrl}/>
        </span>

        <select className={'app-form-select w-full'}
                onChange={(e) => {
                  setActiveShowcase(
                    e.target.value
                  )
                }}
                value={activeShowcase}
        >
          {showcases.map(it => {
            return (
              <option
                key={it.label}
                value={it.label}>
                {it.label}
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

export function DailyShowcase() {
  const appState = useAppState()
  const [activeShowcase, setActiveShowcase] = useState(showcases[0].label)
  const [sizeCache, setSizeCache] = useState([0, 0])
  const [progress, setProgress] = useState(0)
  const bdRef = useRef<HTMLDivElement>(null)

  const nextShowcase = () => {
    const total = showcases.length
    const currentIndex = showcases.findIndex((it) => it.label === activeShowcase)
    let nextIndex = currentIndex + 1
    if (nextIndex >= total) nextIndex = 0
    setActiveShowcase(showcases[nextIndex]?.label)
  }

  useEffect(() => {
    setProgress(0)
  }, [activeShowcase])

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((progress: number) => {
        let nextProgress = progress + 0.2
        if (nextProgress > 100) {
          nextShowcase()
          nextProgress = 0
        }
        return nextProgress
      })
    }, 60)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const handler = () => setSizeCache([])
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  return (
    <div className="app-daily-showcase">
      <AnimateInTurnStage
        ticks={[500, 500]}
        className="flex flex-col sm:justify-center sm:items-center pb-8">
        {(t: Array<string>) => {
          return (
            <>
              <h2
                className={cx('text-2xl sm:text-[36px] sm:leading-10 tracking-wide invisible', t[0] && 'ani-fade-in')}
              >
                <span className="text-logseq-50/80">Logseq helps you</span>
                <span> turn this daily <br/>mess into structured information.</span>
              </h2>

              <h1
                className={cx('text-4xl leading-10 sm:py-10 sm:text-6xl py-3 invisible', t[1] && 'ani-slide-in-from-bottom')}>
                <strong>Gain clarity</strong>
                <span className="text-logseq-50/80"> in your everyday life:</span>
              </h1>
            </>
          )
        }}
      </AnimateInTurnStage>

      {/* Tabs */}
      {appState.sm.get() ?
        <DailyShowcaseSelect
          activeShowcase={activeShowcase}
          setActiveShowcase={setActiveShowcase}/> :
        <DailyShowcaseTabs
          activeShowcase={activeShowcase}
          setActiveShowcase={setActiveShowcase}/>}


      {/* Panels */}
      <div className="panels" ref={bdRef}>
        {showcases.map(it => {
          if (it.label !== activeShowcase) {
            return null
          }

          return (
            <div className={'panel'} key={it.label}>
              <div className="desc">
                <div className="animate-in fade-in">
                  {it.desc}
                </div>
              </div>

              <div className="card sm:flex">
                <div className="l relative animate-in fade-in"
                     style={{
                       width: sizeCache[0] ? (sizeCache[0] + 'px') : 'auto',
                       height: sizeCache[1] ? (sizeCache[1] + 'px') : 'auto'
                     }}
                >
                  <img src={it.descImgUrl as any} alt="image"
                       onLoad={(e: any) => {
                         const { width, height } = e.target
                         !sizeCache?.[0] && setSizeCache([width, height])
                       }}
                  />

                  <div className="ft absolute bottom-6 right-6">
                    {/*<FloatGlassButton*/}
                    {/*  onClick={() => {*/}
                    {/*    const src = bdRef.current!.querySelector('img')?.getAttribute('src')!*/}

                    {/*    openLightbox([{ src, width: 1000, height: 596 }])*/}
                    {/*  }}*/}
                    {/*>*/}
                    {/*  <FrameCorners*/}
                    {/*    className={'font-bold cursor-pointer'}*/}
                    {/*    size={26}*/}
                    {/*    weight={'duotone'}*/}
                    {/*  />*/}
                    {/*</FloatGlassButton>*/}
                  </div>
                </div>

                <div className="r">
                  <div className="inner">
                    <div className="t">
                      <div className="progress flex rounded-full bg-gray-700/50 w-full h-[6px] mt-1 overflow-hidden"
                           onClick={nextShowcase}
                      >
                        <span className="inner bg-logseq-100 rounded-full transition-all"
                              style={{
                                width: `${progress}%`
                              }}
                        ></span>
                      </div>
                    </div>

                    <div className="b">
                      <div className="fd">
                        {it.feedback}
                      </div>

                      <div className="ft">
                        <div className={'flex flex-col'}>
                          <strong className="font-normal opacity-60">User Feedback</strong>
                          <span><span className="font-normal opacity-60 pr-2">by</span>{it.userName}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="opacity-60">Via </span>
                          {(it.refType === 'discord') ?
                            (<><DiscordLogo className="mx-2" size={30} weight="duotone"/> <span
                              className="opacity-60">Discord</span></>) :
                            (<><TwitterLogo className="mx-2" size={30} weight="duotone"/> <span
                              className="opacity-60">Twitter</span></>)}
                          <span
                            className="border rounded p-1 border-gray-600 ml-3 bg-gray-500/20 cursor-pointer active:opacity-80">
                            <a target={'_blank'} href={it.refLink}>
                              <ArrowSquareOut size={18} weight={'duotone'}/>
                            </a>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
