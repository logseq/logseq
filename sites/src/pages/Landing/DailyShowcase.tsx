import { useState } from 'react'
import cx from 'classnames'

const IconImageRelations = new URL('assets/icon_relations.png', import.meta.url)
const IconImageDailyPlan = new URL('assets/icon_daily_plan.png', import.meta.url)
const IconImageJournals = new URL('assets/icon_journals.png', import.meta.url)
const IconImageDataControl = new URL('assets/icon_data_control.png', import.meta.url)

const showcases = [
  {
    label: 'Relationships',
    iconUrl: IconImageRelations,
    desc: (
      <p>
        Communicate better. <span className="opacity-60">Stay on top of your <br/>relationships, conversations, and meetings.</span>
      </p>),
    feedback: (
      <p>
        <span>“It is amazing how many times I’m on the phone with my product manager and</span> he asks a question about
        a stat
        and I can just search my Logseq (with meeting notes, research highlights, etc) live and answer.
        <span>It’s honestly next level.”</span>
      </p>
    )
  },
  {
    label: 'Daily Plan',
    iconUrl: IconImageDailyPlan,
    desc: (
      <p>
        <span>Channel your attention,</span>
        reduce stress.
      </p>),
    feedback: (
      <p>
        “Logseq has actually saved my life, I don’t think I would be able to be a founder without it.
        <span>My brain is so ADD and it just works so well with it.”</span>
      </p>
    )
  },
  {
    label: 'Journaling',
    iconUrl: IconImageJournals,
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
    desc: (
      <p>
        <span>Do all this without lock-in.</span> <br/>
        And without risking your privacy.
      </p>),
    feedback: (
      <p>
        <span>“Logseq does tracking everything in my life</span>
        better than any tool I've ever used, including Roam and I have control of my data.”
      </p>
    )
  }
]

export function DailyShowcase () {
  const [activeShowcase, setActiveShowcase] = useState(showcases[0].label)

  return (
    <div className="app-daily-showcase">
      <div className="flex flex-col justify-center items-center pb-8">
        <h2 className="text-[36px] leading-10 tracking-wide">
          <span className="opacity-60">Logseq helps you</span>
          <span> turn this daily <br/>mess into structured information.</span>
        </h2>

        <h1 className="text-6xl">
          <strong>Gain clarity</strong>
          <span className="opacity-60"> in your everyday life:</span>
        </h1>
      </div>

      {/* Tabs */}
      <div className="tabs flex justify-between space-x-8 px-6">
        {showcases.map(it => {
          return (
            <div className={cx('it flex flex-col flex-1', { active: it.label === activeShowcase })}
                 onClick={() => {
                   setActiveShowcase(it.label)
                 }}
            >
              <span className="icon">
                <img src={it.iconUrl as any} alt={it.label}/>
              </span>
              <strong className="pt-2 font-normal text-lg opacity-60 tracking-wide">
                {it.label}
              </strong>
            </div>
          )
        })}
      </div>

      {/* Panels */}
      <div className="panels">
        {showcases.map(it => {
          if (it.label !== activeShowcase) {
            return null
          }

          return (
            <>
              <div className="desc flex justify-center text-center pt-12 text-4xl leading-10 tracking-wide">
                <div className="animate-in fade-in">
                  {it.desc}
                </div>
              </div>
            </>
          )
        })}

      </div>
    </div>
  )
}
