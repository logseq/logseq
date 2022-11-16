import {
  ClockCounterClockwise,
  Brain,
  FrameCorners,
  PencilLine,
  CaretDown,
  Binoculars,
  Books,
  CalendarCheck,
  Lightbulb,
  CheckCircle,
  Gauge,
  Browsers
} from 'phosphor-react'
import { FloatGlassButton, imageS1 } from './common'
import { AnimateInTurnStage } from '../../components/Animations'
import cx from 'classnames'
import { useState } from 'react'
import { useAppState } from '../../state'

const featuresSlideItems = [
  {
    label: 'Students',
    icon: '🧑‍🎓',
    notes: [
      {
        icon: <ClockCounterClockwise size={20} weight="duotone"/>,
        title: 'Review notes',
        desc: <span>Capture, structure, and review all of your class notes with ease using the
          <a> Linked References</a>, <a>Queries</a>, and <a>Search </a>features.</span>
      },
      {
        icon: <Brain size={20} weight="duotone"/>,
        title: 'Memorize facts',
        desc: (<span>Remember facts and insights using the <a>Flashcards</a> feature.</span>)
      },
      {
        icon: <PencilLine size={20} weight="duotone"/>,
        title: 'Outline essays',
        desc: (
          <span>Organize your thoughts and ideas, and quickly turn them into outlines using <a>Block References</a>.</span>)
      }
    ]
  },
  {
    label: 'Academics',
    icon: '🎓',
    notes: [
      {
        icon: <ClockCounterClockwise size={20} weight="duotone"/>,
        title: 'Review notes',
        desc: <span>Capture, structure, and review all of your class notes with ease using the
          <a> Linked References</a>, <a>Queries</a>, and <a>Search </a>features.</span>
      },
      {
        icon: <Binoculars size={20} weight="duotone"/>,
        title: 'Investigate claims',
        desc: (<span>Spin your web of knowledge and see what evidence supports or contradicts claims.</span>)
      },
      {
        icon: <Books size={20} weight="duotone"/>,
        title: 'Manage sources',
        desc: (<span>Keep track of your research and easily manage your sources using the built-in
          <a> Zotero integration</a>.</span>)
      },
      {
        icon: <PencilLine size={20} weight="duotone"/>,
        title: 'Outline papers',
        desc: (
          <span>Manage your writing process and ensure that your papers are well-organized and flow smoothly.</span>)
      }
    ]
  },
  {
    label: 'Writers',
    icon: '🖋',
    notes: [
      {
        icon: <ClockCounterClockwise size={20} weight="duotone"/>,
        title: 'Review notes',
        desc: <span>Capture, structure, and review all of your class notes with ease using the
          <a> Linked References</a>, <a>Queries</a>, and <a>Search </a>features.</span>
      },
      {
        icon: <CalendarCheck size={20} weight="duotone"/>,
        title: 'Manage writing stages',
        desc: (
          <span>
           Manage your personal writing process using <a>Tasks</a>,
           <a>Tags</a>, and <a>Queries</a> --no matter how simple or complex it is.
         </span>
        )
      },
      {
        icon: <Lightbulb size={20} weight="duotone"/>,
        title: 'Combine ideas',
        desc: (
          <span>
            Effortlessly synthesize ideas from across your collection of notes using
            <a> Block References</a>.
          </span>
        )
      },
      {
        icon: <PencilLine size={20} weight="duotone"/>,
        title: 'Outline content',
        desc: (<span>Organize your thoughts and reuse ideas in easy-to-manage outlines.</span>)
      }
    ]
  },
  {
    label: 'Project Managers',
    icon: '📆',
    notes: [
      {
        icon: <ClockCounterClockwise size={20} weight="duotone"/>,
        title: 'Retrieve notes',
        desc: (<span>
          Always find the information where and when you need it using
          <a> Linked References</a>, <a>Queries</a> or <a>Search</a>.
        </span>)
      },
      {
        icon: <CheckCircle size={20} weight="duotone"/>,
        title: 'Manage tasks',
        desc: (
          <span>
            Manage tasks with Logseq's built-in
            <a> Task management system</a>, including
            <a> Priorities</a>, <a>Scheduling</a>, and
            <a> Deadlines</a>.
          </span>
        )
      },
      {
        icon: <Gauge size={20} weight="duotone"/>,
        title: 'Create dashboards',
        desc: (
          <span>
            Easily create dynamic dashboards to separate tasks and notes and keep track of many projects simultaneously.
          </span>
        )
      },
      {
        icon: <PencilLine size={20} weight="duotone"/>,
        title: 'Outline documents',
        desc: (<span>Quickly pull together information and share it in different formats with stakeholders.</span>)
      }
    ]
  },
  {
    label: 'Developers',
    icon: '💻',
    notes: [
      {
        icon: <ClockCounterClockwise size={20} weight="duotone"/>,
        title: 'Retrieve notes',
        desc: (
          <span>
          Quickly find relevant information using the
          <a> Linked References</a>, <a>Queries</a> or <a>Search</a>.
        </span>
        )
      },
      {
        icon: <Brain size={20} weight="duotone"/>,
        title: 'Memorize shortcuts',
        desc: (
          <span>
            Become a 10x programmer by remembering more of what you need to do repeatedly.
          </span>
        )
      },
      {
        icon: <Lightbulb size={20} weight={'duotone'}/>,
        title: 'Decide on solutions',
        desc: (
          <span>
            Find the best solutions to nagging problems by tracking your ideas, decisions, and priorities over time.
          </span>
        )
      },
      {
        icon: <Browsers size={20} weight="duotone"/>,
        title: 'Build a personal wiki',
        desc: (
          <span>
            Build your career by building your personal wiki. Easily structure your knowledge and find it back
            using <a>Namespaces</a>, <a>Linked References</a>, and <a>Queries</a>.
          </span>
        )
      }
    ]
  }
]

export function TutorialFeaturesDescCard (
  props: typeof featuresSlideItems[number]['notes'][number]
) {
  return (
    <div className={'desc-card'}>
      <h1 className={'flex items-center text-[18px] sm:text-[20px]'}>
        <span
          className={'scale-90 sm:scale-100 w-[34px] h-[34px] bg-gray-400/40 rounded-full flex items-center justify-center'}>
          {props.icon}
        </span>
        <strong className={'whitespace-nowrap font-normal pl-[14px]'}>
          {props.title}
        </strong>
      </h1>

      <h2 className={'hidden sm:block pl-12 py-2 text-gray-200/70 leading-6 text-base'}>
        {props.desc}
      </h2>
    </div>
  )
}

export function TutorialFeaturesPanelHolder (
  props: { withoutLogo?: boolean }
) {
  return (
    <div className={cx('app-window-holder animate-in zoom-in-50 duration-500', props.withoutLogo && 'without-logo')}>
    </div>
  )
}

export function TutorialFeaturesPanel (
  props: Partial<{ activeItem: typeof featuresSlideItems[number] }>
) {
  let inner = (
    <>
      <div className="a">
        <TutorialFeaturesPanelHolder/>
      </div>
      <div className="b">
        {props.activeItem?.notes.map(it => {
          return <TutorialFeaturesDescCard key={it.title} {...it} />
        })}
      </div>
      <div className="c sm:hidden">
        <TutorialFeaturesPanelHolder withoutLogo={true} />
      </div>
    </>
  )

  return (
    <article className="app-tutorial-features-panel relative">
      {/*<div className="hd">*/}
      {/*  <strong>*/}
      {/*    <i>1</i>*/}
      {/*    <i>2</i>*/}
      {/*  </strong>*/}

      {/*  <h1 className="flex text-lg sm:text-3xl justify-center">*/}
      {/*    Capturing and structuring class notes*/}
      {/*  </h1>*/}
      {/*</div>*/}

      <div className="bd">
        <div className={cx(`wrap flex`, `is-${props.activeItem?.label.toLocaleLowerCase()}`)}>
          {inner}
        </div>
      </div>

      {/*<div className="ft absolute bottom-6 right-6">*/}
      {/*  <FloatGlassButton>*/}
      {/*    <FrameCorners*/}
      {/*      className={'font-bold cursor-pointer'}*/}
      {/*      size={26}*/}
      {/*      weight={'duotone'}*/}
      {/*    />*/}
      {/*  </FloatGlassButton>*/}
      {/*</div>*/}
    </article>
  )
}

export function TutorialFeaturesSlide () {
  const [activeIndex, setActiveIndex] = useState(0)
  const activeItem = featuresSlideItems[activeIndex]

  return (
    <div className="app-tutorial-features-slide">
      <div className="inner px-2">
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
      <AnimateInTurnStage
        ticks={[100, 500, 1200]}
        className="flex flex-col py-10 px-4 sm:justify-center sm:items-center sm:py-20 hd">
        {(t: Array<string>) => {
          return (
            <>
              <h1 className={cx('text-4xl sm:text-6xl text-logseq-50/80 invisible', t[0] && 'ani-slide-in-from-bottom')}>Today,
                everyone is
                a</h1>
              <h2
                className={cx('text-4xl sm:text-6xl font-semibold pt-1 opacity-94 invisible', t[1] && 'ani-slide-in-from-bottom')}>knowledge
                worker.</h2>

              <div
                className={cx('pt-2 sm:pt-0 sm:flex justify-center sm:flex-col items-center invisible', t[2] && 'ani-fade-in')}>
                <h3 className="inline text-2xl sm:text-4xl font-normal pt-8 text-logseq-50/80">Logseq is the
                  open toolbox
                  for </h3>
                <h4 className="inline text-2xl sm:text-4xl pt-2 opacity-94">
                  workflows that deal with lots of information:
                </h4>
              </div>
            </>
          )
        }}
      </AnimateInTurnStage>

      {/* Head icons */}
      <ul className="hidden sub-hd sm:flex justify-center space-x-10">
        <li>Task Management</li>
        <li>PDF Annotations</li>
        <li>Flashcards</li>
        <li>
          <span className="relative">
            Whiteboards<sup>NEW</sup>
          </span>
        </li>
      </ul>

      {/* Tutorial Features Slide/Select */}
      {appState.sm.get() ?
        <TutorialFeaturesSelect/> :
        <TutorialFeaturesSlide/>
      }
    </div>
  )
}
