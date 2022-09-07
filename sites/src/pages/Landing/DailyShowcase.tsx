import { useEffect, useRef, useState } from 'react'
import cx from 'classnames'
import { FloatGlassButton, openLightbox } from './common'
import { ArrowSquareOut, FrameCorners, TwitterLogo } from 'phosphor-react'
import { AnimateInTurnBox } from '../../components/Animations'

const IconImageRelations = new URL('assets/icon_relations.png', import.meta.url)
const IconImageDailyPlan = new URL('assets/icon_daily_plan.png', import.meta.url)
const IconImageJournals = new URL('assets/icon_journals.png', import.meta.url)
const IconImageDataControl = new URL('assets/icon_data_control.png', import.meta.url)

const showcases = [
  {
    label: 'Relationships',
    iconUrl: IconImageRelations,
    descImgUrl: new URL('./assets/benefit-0.png', import.meta.url),
    desc: (
      <p>
        Communicate better. <span className="opacity-60">Stay on top of your <br/>relationships, conversations, and meetings.</span>
      </p>),
    feedback: (
      <p>
        <span>“It is amazing how many times I’m on the phone with my product manager and</span> he asks a question about
        a stat
        and I can just search my Logseq (with meeting notes, research highlights, etc) live and answer.
        <span> It’s honestly next level.”</span>
      </p>
    )
  },
  {
    label: 'Daily Plan',
    iconUrl: IconImageDailyPlan,
    descImgUrl: new URL('./assets/benefit-1.png', import.meta.url),
    desc: (
      <p>
        <span>Channel your attention,</span>
        reduce stress.
      </p>),
    feedback: (
      <p>
        “Logseq has actually saved my life, I don’t think I would be able to be a founder without it.
        <span> My brain is so ADD and it just works so well with it.”</span>
      </p>
    )
  },
  {
    label: 'Journaling',
    iconUrl: IconImageJournals,
    descImgUrl: new URL('./assets/benefit-2.png', import.meta.url),
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

export function DailyShowcase () {
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
      <AnimateInTurnBox
        ticks={[500, 500]}
        className="flex flex-col justify-center items-center pb-8">
        {(t: Array<string>) => {
          return (
            <>
              <h2
                className={cx('text-[36px] leading-10 tracking-wide invisible', t[0] && 'ani-fade-in')}
              >
                <span className="opacity-60">Logseq helps you</span>
                <span> turn this daily <br/>mess into structured information.</span>
              </h2>

              <h1 className={cx('text-6xl py-3 invisible', t[1] && 'ani-slide-in-from-bottom')}>
                <strong>Gain clarity</strong>
                <span className="opacity-60"> in your everyday life:</span>
              </h1>
            </>
          )
        }}
      </AnimateInTurnBox>

      {/* Tabs */}
      <div className="tabs flex justify-between space-x-8 px-6">
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
      </div>

      {/* Panels */}
      <div className="panels" ref={bdRef}>
        {showcases.map(it => {
          if (it.label !== activeShowcase) {
            return null
          }

          return (
            <div className={'panel'} key={it.label}>
              <div className="desc flex justify-center text-center pt-12 text-4xl leading-10 tracking-wide">
                <div className="animate-in fade-in">
                  {it.desc}
                </div>
              </div>

              <div className="card flex">
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
                    <FloatGlassButton
                      onClick={() => {
                        const src = bdRef.current!.querySelector('img')?.getAttribute('src')!

                        openLightbox([{ src, width: 1000, height: 596 }])
                      }}
                    >
                      <FrameCorners
                        className={'font-bold cursor-pointer'}
                        size={26}
                        weight={'duotone'}
                      />
                    </FloatGlassButton>
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
                        <strong className="font-normal opacity-60">User Feedback</strong>
                        <div className="flex items-center">
                          <span className="opacity-60">Via </span>
                          <TwitterLogo className="mx-2" size={30} weight="duotone"/>
                          <span className="opacity-60">Twitter</span>
                          <span
                            className="border rounded p-1 border-gray-600 ml-3 bg-gray-500/20 select-none cursor-pointer active:opacity-80">
                            <ArrowSquareOut size={18} weight={'duotone'}/>
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
