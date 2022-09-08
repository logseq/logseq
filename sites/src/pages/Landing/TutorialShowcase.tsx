import { FrameCorners } from 'phosphor-react'
import { FloatGlassButton, imageS1 } from './common'
import { AnimateInTurnBox } from '../../components/Animations'
import cx from 'classnames'
import { useState } from 'react'

const featuresSlideItems = [
  {
    label: 'Students',
    icon: '🧑‍🎓'
  },
  {
    label: 'Writers',
    icon: '🖋'
  },
  {
    label: 'Academics',
    icon: '🎓'
  },
  {
    label: 'Project Managers',
    icon: '📆'
  },
  {
    label: 'Developers',
    icon: '💻'
  }
]

export function TutorialFeaturesSlide () {
  const [activeTab, setActiveTab] = useState(featuresSlideItems[0].label)

  return (
    <div className="app-tutorial-features-slide">
      <div className="inner px-14">
        {/* Tabs */}
        <ul className="tabs flex flex space-x-8 justify-around">
          {featuresSlideItems.map(it => {
            return (
              <li
                key={it.label}
                className={cx({ active: (it.label === activeTab) })}
                  onClick={() => setActiveTab(it.label)}
              >
                <span>{it.icon}</span><strong>{it.label}</strong>
              </li>)
          })}
        </ul>

        {/* Panel */}
        <article className="panels relative">
          <div className="hd">
            <strong>
              <i>1</i>
              <i>2</i>
            </strong>

            <h1 className="flex text-3xl justify-center">
              Capturing and structuring class notes
            </h1>
          </div>
          <div className="bd">
            <div className="wrap flex">
              <img src={imageS1} alt="images"/>
            </div>
          </div>
          <div className="ft absolute bottom-6 right-6">
            <FloatGlassButton>
              <FrameCorners
                className={'font-bold cursor-pointer'}
                size={26}
                weight={'duotone'}
              />
            </FloatGlassButton>
          </div>
        </article>
      </div>
    </div>
  )
}

export function TutorialShowcase (
  props: {},
) {

  return (
    <div className="app-tutorial-showcase">
      {/* Head Slogan */}
      <AnimateInTurnBox
        ticks={[100, 500, 1200]}
        className="flex flex-col justify-center items-center py-20 hd">
        {(t: Array<string>) => {
          return (
            <>
              <h1 className={cx('text-6xl opacity-70 invisible', t[0] && 'ani-slide-in-from-bottom')}>Today, everyone is
                a</h1>
              <h2
                className={cx('text-6xl font-semibold pt-1 opacity-94 invisible', t[1] && 'ani-slide-in-from-bottom')}>knowledge
                worker.</h2>

              <div className={cx('flex justify-center flex-col items-center invisible', t[2] && 'ani-fade-in')}>
                <h3 className="text-4xl font-normal pt-8 opacity-60">Logseq is the
                  all-in-one tool
                  for </h3>
                <h4 className="text-4xl pt-2 opacity-94">
                  workflows that deal with lots of information:
                </h4>
              </div>
            </>
          )
        }}
      </AnimateInTurnBox>

      {/* Head icons */}
      <ul className="sub-hd flex justify-center space-x-10">
        <li>Task Management</li>
        <li>PDF Annotations</li>
        <li>Flashcards</li>
      </ul>

      {/* Tutorial Features Slide */}
      <TutorialFeaturesSlide/>
    </div>
  )
}
