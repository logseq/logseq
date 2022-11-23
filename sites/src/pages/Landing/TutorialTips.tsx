import { AppLogo, FloatGlassButton, openLightbox } from './common'
import {
  ArrowCircleLeft,
  ArrowCircleRight, ChatsCircle, DiscordLogo,
  FrameCorners, MonitorPlay, Notebook, SignOut,
  StarFour, SignIn
} from 'phosphor-react'
import { Button } from '../../components/Buttons'
import { AnimateInTurnStage } from '../../components/Animations'
import cx from 'classnames'
import Swiper from 'swiper'
import 'swiper/swiper-bundle.css'

import 'photoswipe/dist/photoswipe.css'
import { ReactNode, useEffect, useRef, useState } from 'react'
import { useMounted } from '../../hooks'
import { promiseImages } from './index'
import { useAppState } from '../../state'

export function TipSlideItem (props: {
  isSm: boolean,
  inActive: boolean,
  headEmoji: string,
  headTitle: string,
  content: ReactNode | string,
  tips: Array<ReactNode | string>,
  complete?: () => void,
  activeTipChanged?: (tag: string) => void
  className?: string
}) {
  const {
    inActive,
    headEmoji,
    headTitle,
    content,
    className,
    tips,
    complete,
    activeTipChanged,
    isSm,
    ...rest
  } = props
  const [activeTip, setActiveTip] = useState({ active: 0, progress: 0 })
  const [_tipProgressTimer, setProgressTimer] = useState<number>(0) // interval timer
  const isMounted = useMounted()

  const resetState = () => {
    setActiveTip({ active: 0, progress: 0 })
    setProgressTimer(0)
  }

  const updateActiveNum = (active: number) => {
    setActiveTip(() => {
      return { active, progress: 0 }
    })
  }

  useEffect(() => {
    if (!isMounted.current) return

    if (!inActive) {
      clear()
      resetState()
      return
    }

    function clear () {
      setProgressTimer((timer) => {
        clearInterval(timer)
        return 0
      })
    }

    const tickHandler = () => {
      // async
      setActiveTip(({ active, progress }) => {
        let toProgress = progress + 0.4
        let toActive = active

        if (toProgress > 100) {
          if (active) {
            clear()
            complete?.()
            toProgress = 100
          } else {
            toProgress = 0
            toActive = 1
          }
        }

        return { active: toActive, progress: toProgress }
      })
    }

    function run () {
      clear()
      const timer = setInterval(tickHandler, 60)
      setProgressTimer(timer as any)
    }

    console.log('run ....')
    run()

    return clear
  }, [inActive])

  useEffect(() => {
    inActive && activeTipChanged?.(activeTip.active.toString())
  }, [activeTip.active, inActive])

  return (
    <div className={cx('item swiper-slide a', className)} {...rest}>
      {/*  Beginner */}
      <h1 className="flex">
        <strong className="text-3xl pr-4">{headEmoji}</strong>
        <Button
          className={'text-sm cursor-text'}
          leftIcon={<StarFour size={16}/>}
        >
          {headTitle}
        </Button>
      </h1>

      <h2 className="pt-2 text-[20px] sm:text-3xl text-gray-300">
        {content}
      </h2>

      <strong className="progress">
        <i onClick={() => updateActiveNum(0)}
        ><small style={{
          width: (!activeTip.active ? activeTip.progress : 100) + '%',
        }}>1</small></i>
        <i onClick={() => updateActiveNum(1)}
        ><small
          style={{
            width: (!activeTip.active ? 0 : activeTip.progress) + '%',
          }}>2</small></i>
      </strong>

      <h3 className="flex text-sm sm:text-lg space-x-2 px-1 py-2 tracking-wide">
        {tips.map((it, idx) => {
          if (activeTip.active !== idx) return

          return (
            <span className={'animate-in duration-1000 fade-in-0'} key={idx}>
              <strong>Tip {idx + 1}: </strong>
              <span className="text-gray-300/70">{it}</span>
            </span>
          )
        })}
      </h3>
    </div>
  )
}

export function TutorialTips () {
  const appState = useAppState()
  const swiperElRef = useRef<HTMLDivElement>(null)
  const swiperRef = useRef<Swiper>(null)
  const bdRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [activeTipTag, setActiveTipTag] = useState('00')
  const sidesLen = 3
  const isSm = appState.sm.get()

  useEffect(() => {
    if (swiperRef.current) return

    // @ts-ignore
    const sw = swiperRef.current = new Swiper(
      swiperElRef.current!, {
        loop: false,
      },
    )

    sw.on('activeIndexChange', () => {
      setActiveIndex(sw.realIndex)
    })
  }, [])

  return (
    <div className="app-tutorial-tips">
      <AnimateInTurnStage
        ticks={[500, 1, 300, 1]}
        className="hd flex flex-col justify-center items-center">
        {(t: Array<any>) => (<>
          <h1 className={cx('invisible pb-4 sm:pb-0 sm:flex items-center',
            t[0] && 'ani-slide-in-from-bottom')}>
            <span className="pr-5 text-logseq-50/80">
              Braindump everything into
            </span>
            <AppLogo className="w-10 h-10 sm:w-16 sm:h-16"/>
            <span className="pl-2 text-logseq-50/80">.</span>

            <h2 className={'inline-block pl-2 sm:!hidden'}>
              New ideas will pop up with time.
            </h2>
          </h1>

          {appState.sm.get() ?
            null :
            <h2 className={cx('invisible', t[1] && 'ani-slide-in-from-bottom')}>
              New ideas will pop up with time.
            </h2>
          }


          <h3 className={cx('invisible', t[2] && 'ani-fade-in')}>
            Using Logseq helps you organize your thoughts and ideas
          </h3>

          <h4 className={cx('invisible', t[3] && 'ani-fade-in')}>
            <span className="text-logseq-50/80">so that you can </span>
            <span className="opacity-100 pl-1">
              come up with new outputs more easily.
            </span>
          </h4>
        </>)
        }
      </AnimateInTurnStage>

      <div className="bd sm:flex">
        <div ref={swiperElRef} className="bd-slides swiper">
          <div className="items swiper-wrapper">
            {/* 1 */}
            <TipSlideItem
              isSm={isSm}
              inActive={activeIndex === 0}
              headEmoji={'✍️'}
              headTitle={'Beginner'}
              content={<span>Get in the habit of writing {isSm ? null : <br/>}thoughts down every day.</span>}
              tips={[
                'Think in sections, use indentation.',
                'Use links & hashtags.',
              ]}
              complete={() => {
                swiperRef.current?.slideNext()
              }}
              activeTipChanged={(tag) => {
                setActiveTipTag?.(`0${tag}`)
              }}

            />

            {/* 2 */}
            <TipSlideItem
              isSm={isSm}
              inActive={activeIndex === 1}
              headEmoji={'🔍️'}
              headTitle={'Intermediate'}
              content={<span>Always find what you’re {isSm ? null : <br/>} looking for.</span>}
              tips={[
                'Use CMD-K to search with ease.',
                <span className={'sm:text-lg'}>Go through linked references to find valuable information nuggets from the past.</span>,
              ]}
              complete={() => {
                swiperRef.current?.slideNext()
              }}
              activeTipChanged={(tag) => {
                setActiveTipTag?.(`1${tag}`)
              }}
            />

            {/*  3 */}
            <TipSlideItem
              isSm={isSm}
              inActive={activeIndex === 2}
              headEmoji={'💼️'}
              headTitle={'Expert'}
              content={<span>Create your own processes.</span>}
              tips={[
                <span>Use queries to generate tables of {isSm ? null : <br/>} relevant information.</span>,
                'Install plugins and customize the app around your workflow needs.',
              ]}
              complete={() => {
                swiperRef.current?.slideTo(0)
              }}
              activeTipChanged={(tag) => {
                setActiveTipTag?.(`2${tag}`)
              }}
            />
          </div>
        </div>

        <div className="bd-actions flex">
          <span className="prev" title={'Previous'}
                onClick={() => {
                  if (activeIndex == 0) {
                    return swiperRef.current?.slideTo(2)
                  }

                  swiperRef.current?.slidePrev()
                }}
          >
           <ArrowCircleLeft size={26}/>
          </span>

          <div
            className="dots flex space-x-3 rounded-2xl bg-gray-700/40 py-2 px-4 items-center">
            {Array(sidesLen).fill(0).map((_, i) => {
              return (
                <i key={i}
                   className={cx(
                     'w-2 h-2 bg-logseq-100/50 rounded-2xl cursor-pointer select-none hover:opacity-80',
                     (i === activeIndex) && '!bg-white/90')}
                   onClick={() => {
                     swiperRef.current?.slideTo(i)
                   }}
                ></i>
              )
            })}
          </div>

          <span className="next" title={'Next'}
                onClick={() => {
                  if (activeIndex == 2) {
                    return swiperRef.current?.slideTo(0)
                  }

                  swiperRef.current?.slideNext()
                }}
          >
              <ArrowCircleRight size={26}/>
            </span>
        </div>

        <div className="bd-info" ref={bdRef}>
          <div className="flex image-wrap">
            <img className={'animate-in fade-in-0 duration-1000'}
                 src={promiseImages[activeTipTag]} alt="image"/>
          </div>

          {/*<FloatGlassButton*/}
          {/*  className="absolute right-6 bottom-5"*/}
          {/*  onClick={() => {*/}
          {/*    const src = bdRef.current!.querySelector('img')?.getAttribute('src')!*/}

          {/*    openLightbox([{ src, width: 900, height: 553 }])*/}
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

      {/*  more resources */}
      <div className="ft mt-14 sm:flex sm:h-28 sm:mt-28">
        <div className="flex-1 sm:flex flex-col justify-center items-center">
          <h2 className="text-xl sm:text-2xl">More Resources</h2>
          <div className="sm:flex sm:space-x-6 py-5">
            <div>
              <Button
                leftIcon={<MonitorPlay size={24} weight={'duotone'}/>}
                href={`https://discuss.logseq.com/`}
                className={'w-full sm:w-auto'}
              >
                Knowledge Hub
              </Button>
              <span
                className="hidden sm:inline-block text-[11px] pt-2 text-center w-full text-gray-400/80">
                Accessible content for new users
              </span>
            </div>

            <div className={'mt-3.5 border-b pb-8 border-b-logseq-300 sm:border-0 sm:mt-0'}>
              <Button
                className="bg-logseq-700 w-full sm:w-auto"
                leftIcon={<Notebook size={24} weight={'duotone'}/>}
                href={`https://docs.logseq.com/#/page/Contents`}
              >
                Documentation
              </Button>
              <span
                className="hidden sm:inline-block text-[11px]  pt-2 text-center w-full text-gray-400/80">
                Feature details
              </span>
            </div>
          </div>
        </div>

        <div
          className="flex-1 sm:flex flex-col justify-center items-center sm:border-l sm:border-l-logseq-500">
          <h2 className="text-xl sm:text-2xl mt-2 sm:-mt-8">A helpful community</h2>

          <div className="sm:flex sm:space-x-6 py-5">
            <div className="flex flex-col space-x-2">
              <Button
                className="bg-[#7289da] px-4 sm:px-8"
                leftIcon={<DiscordLogo size={20} weight={'duotone'}/>}
                rightIcon={<SignIn className="opacity-40" size={20} weight={'duotone'}/>}
                href={`https://discord.gg/VNfUaTtdFb`}
              >
                Join our Discord
              </Button>

              <span
                className="text-[12px] flex items-center pt-2 sm:justify-center text-gray-400/80">
              <strong className="h-2 w-2 bg-green-600 rounded"></strong>
              <strong className="pl-2 pr-1">{appState.discord?.approximate_presence_count.get() || '-'}</strong>
              users online currently
            </span>
            </div>

            <div className="flex flex-col mt-3 sm:mt-0">
              <Button
                leftIcon={<ChatsCircle size={24} weight={'duotone'}/>}
                rightIcon={<SignIn className="opacity-40" size={20} weight={'duotone'}/>}
                href={`https://discuss.logseq.com`}
                className={'bg-logseq-700 w-full sm:w-auto'}
              >
                Join our forum
              </Button>
              <span
                className="hidden sm:inline-block text-[11px] pt-2 text-center w-full text-gray-400/80">
                Feature requests, bugs, discussions
              </span>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
