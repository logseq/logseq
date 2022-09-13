import { FrameCorners, CaretLeft, CaretDown } from 'phosphor-react'
import { FloatGlassButton, imageS1 } from './common'
import { AnimateInTurnBox } from '../../components/Animations'
import cx from 'classnames'
import { useEffect, useState } from 'react'
import { useAppState } from '../../state'

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

export function TutorialFeaturesPanel (
  props: Partial<{ activeItem: typeof featuresSlideItems[number] }>
) {
  return (
    <article className="app-tutorial-features-panel relative">
      <div className="hd">
        <strong>
          <i>1</i>
          <i>2</i>
        </strong>

        <h1 className="flex text-lg sm:text-3xl justify-center">
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
  )
}

export function TutorialFeaturesSlide () {
  const [activeIndex, setActiveIndex] = useState(0)
  const activeItem = featuresSlideItems[activeIndex]

  return (
    <div className="app-tutorial-features-slide">
      <div className="inner px-14">
        {/* Tabs */}
        <ul className="tabs flex flex space-x-8 justify-around">
          {featuresSlideItems.map((it, idx) => {
            return (
              <li
                key={it.label}
                className={cx({ active: (idx === activeIndex) })}
                onClick={() => setActiveIndex(idx)}
              >
                <span>{it.icon}</span><strong>{it.label}</strong>
              </li>)
          })}
        </ul>

        {/* Panel */}
        <TutorialFeaturesPanel activeItem={activeItem}/>
      </div>
    </div>
  )
}

export function TutorialFeaturesSelect () {
  const [activeIndex, setActiveIndex] = useState(0)
  const activeItem = featuresSlideItems[activeIndex]

  return (
    <div className={cx('app-tutorial-features-select', `index-of-${activeIndex}`)}>
      <div className="app-form-select-wrap">
        <span className="icon">
          {activeItem.icon}
        </span>

        <select className={'app-form-select w-full'}
                onChange={(e) => {
                  setActiveIndex(
                    e.target.selectedIndex
                  )
                }}
                value={activeIndex}
        >
          {featuresSlideItems.map((it, idx) => {
            return (<option
              key={it.label}
              value={idx}
            >{it.label}</option>)
          })}
        </select>

        <span className="arrow">
          <CaretDown weight={'bold'}/>
        </span>
      </div>

      {/* Panel */}
      <TutorialFeaturesPanel activeItem={activeItem}/>
    </div>
  )
}

export function TutorialShowcase (
  props: {},
) {
  const appState = useAppState()

  return (
    <div className="app-tutorial-showcase">
      {/* Head Slogan */}
      <AnimateInTurnBox
        ticks={[100, 500, 1200]}
        className="flex flex-col py-10 px-4 sm:justify-center sm:items-center sm:py-20 hd">
        {(t: Array<string>) => {
          return (
            <>
              <h1 className={cx('text-4xl sm:text-6xl opacity-70 invisible', t[0] && 'ani-slide-in-from-bottom')}>Today,
                everyone is
                a</h1>
              <h2
                className={cx('text-4xl sm:text-6xl font-semibold pt-1 opacity-94 invisible', t[1] && 'ani-slide-in-from-bottom')}>knowledge
                worker.</h2>

              <div
                className={cx('pt-2 sm:pt-0 sm:flex justify-center sm:flex-col items-center invisible', t[2] && 'ani-fade-in')}>
                <h3 className="inline text-2xl sm:text-4xl font-normal pt-8 opacity-60">Logseq is the
                  all-in-one tool
                  for </h3>
                <h4 className="inline text-2xl sm:text-4xl pt-2 opacity-94">
                  workflows that deal with lots of information:
                </h4>
              </div>
            </>
          )
        }}
      </AnimateInTurnBox>

      {/* Head icons */}
      <ul className="hidden sub-hd sm:flex justify-center space-x-10">
        <li>Task Management</li>
        <li>PDF Annotations</li>
        <li>Flashcards</li>
      </ul>

      {/* Tutorial Features Slide/Select */}
      {appState.sm.get() ?
        <TutorialFeaturesSelect/> :
        <TutorialFeaturesSlide/>
      }
    </div>
  )
}
