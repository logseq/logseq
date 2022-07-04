import { AppLogo, FloatGlassButton, imageS1 } from './common'
import {
  ArrowCircleLeft,
  ArrowCircleRight, Brain, DiscordLogo,
  FrameCorners, MonitorPlay, Notebook, SignOut, Sparkle,
  StarFour,
} from 'phosphor-react'
import { LSButton } from '../../components/Buttons'
import { AnimateInTurnBox } from '../../components/Animations'
import cx from 'classnames'
import Swiper from 'swiper'
import 'swiper/swiper-bundle.css'
import { useEffect, useRef, useState } from 'react'

export function TutorialTips () {
  const swiperElRef = useRef<HTMLDivElement>(null)
  const swiperRef = useRef<Swiper>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const sidesLen = 3

  useEffect(() => {
    if (swiperRef.current) return

    // @ts-ignore
    const sw = swiperRef.current = new Swiper(
      swiperElRef.current!, {
        loop: true,
      },
    )

    sw.on('activeIndexChange', () => {
      setActiveIndex(sw.realIndex)
    })
  }, [])

  return (
    <div className="app-tutorial-tips">
      <AnimateInTurnBox
        ticks={[500, 1, 300, 1]}
        className="hd flex flex-col justify-center items-center">
        {(t: Array<any>) => (<>
          <h1 className={cx('invisible flex items-center',
            t[0] && 'ani-slide-in-from-bottom')}>
            <span className="pr-5 opacity-60">
              Braindump everything into
            </span>
            <AppLogo className="w-16 h-16"/>
            <span className="pl-2 opacity-60">.</span>
          </h1>
          <h2 className={cx('invisible', t[1] && 'ani-slide-in-from-bottom')}>
            New ideas will pop up with time.
          </h2>

          <h3 className={cx('invisible', t[2] && 'ani-fade-in')}>
            Using Logseq helps you organize your thoughts and ideas
          </h3>
          <h4 className={cx('invisible', t[3] && 'ani-fade-in')}>
            <span className="opacity-60">so that you can</span>
            <span className="opacity-100 pl-1">
          come up with new outputs more easily.
          </span>
          </h4>
        </>)
        }
      </AnimateInTurnBox>
      <div className="bd flex">
        <div ref={swiperElRef} className="bd-slides swiper">
          <div className="items swiper-wrapper">
            {/* 1 */}
            <div className="item swiper-slide a">
              {/*  Beginner */}
              <h1 className="flex">
                <strong className="text-3xl pr-4">✍️</strong>
                <LSButton
                  className={'text-sm cursor-text'}
                  leftIcon={<StarFour size={16}/>}
                >
                  Beginner
                </LSButton>
              </h1>

              <h2 className="pt-2 text-3xl text-gray-300">
                Get in the habit of writing <br/>
                thoughts down every day.
              </h2>

              <strong className="progress">
                <i>1</i>
                <i>2</i>
              </strong>

              <h3 className="flex text-lg space-x-2 px-1 py-2 tracking-wide">
                <strong>Tip1:</strong>
                <span className="text-gray-300/70">Think in sections, use indentation.</span>
              </h3>
            </div>

            {/* 2 */}
            <div className="item swiper-slide a">
              <h1 className="flex">
                <strong className="text-3xl pr-4">🔍️</strong>
                <LSButton
                  className={'text-sm cursor-text'}
                  leftIcon={<Sparkle size={16}/>}
                >
                  Intermediate
                </LSButton>
              </h1>

              <h2 className="pt-2 text-3xl text-gray-300">
                Always find what you’re <br/>
                looking for.
              </h2>

              <strong className="progress">
                <i>1</i>
                <i>2</i>
              </strong>

              <h3 className="flex text-lg space-x-2 px-1 py-2 tracking-wide">
                <strong>Tip1:</strong>
                <span className="text-gray-300/70">
                  Use CMD-K to search with ease.
                </span>
              </h3>
            </div>

            {/*  3 */}
            <div className="item swiper-slide a">
              <h1 className="flex">
                <strong className="text-3xl pr-4">💼️</strong>
                <LSButton
                  className={'text-sm cursor-text'}
                  leftIcon={<Brain size={16}/>}
                >
                  Expert
                </LSButton>
              </h1>

              <h2 className="pt-2 text-3xl text-gray-300">
                Create your own processes.
              </h2>

              <strong className="progress">
                <i>1</i>
                <i>2</i>
              </strong>

              <h3 className="text-lg space-x-2 px-1 py-2 tracking-wide">
                <strong>Tip1:</strong>
                <span className="text-gray-300/70">
                  Use queries to generate tables of <br/> relevant information.
                </span>
              </h3>
            </div>
          </div>
        </div>

        <div className="bd-actions flex">
          <span className="prev" title={'Previous'}
                onClick={() => swiperRef.current?.slidePrev()}
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
                     swiperRef.current?.slideTo(i + 1)
                   }}
                ></i>
              )
            })}
          </div>

          <span className="next" title={'Next'}
                onClick={() => swiperRef.current?.slideNext()}
          >
              <ArrowCircleRight size={26}/>
            </span>
        </div>

        <div className="bd-info">
          <div className="flex">
            <img src={imageS1} alt="image"/>
          </div>

          <FloatGlassButton className="absolute right-6 bottom-5">
            <FrameCorners className={'opacity-80 font-bold cursor-pointer'}
                          size={28}/>
          </FloatGlassButton>
        </div>
      </div>

      {/*  more resources */}
      <div className="ft flex h-28 mt-28">
        <div className="flex-1 flex flex-col justify-center items-center">
          <h2 className="text-2xl">More Resources</h2>
          <div className="flex space-x-6 py-5">
            <div>
              <LSButton
                leftIcon={<MonitorPlay size={24}/>}>
                Community Hub
              </LSButton>
              <span
                className="text-[11px] inline-block pt-2 text-center w-full text-gray-400/80">
                Accessible content for new users
              </span>
            </div>

            <div>
              <LSButton
                className="bg-logseq-700"
                leftIcon={<Notebook size={24}/>}>
                Documentation
              </LSButton>
              <span
                className="text-[11px] inline-block pt-2 text-center w-full text-gray-400/80">
                Feature details
              </span>
            </div>
          </div>
        </div>

        <div
          className="flex-1 flex flex-col justify-center items-center border-l border-l-logseq-500">
          <h2 className="text-2xl tracking-wide">A helpful community</h2>
          <div className="flex flex-col space-x-2 pt-10 -translate-y-6">
            <LSButton
              className="bg-[#7289da] px-6"
              leftIcon={<DiscordLogo size={20}/>}
              rightIcon={<SignOut className="opacity-40" size={20}/>}
            >
              Join our Discord
            </LSButton>

            <span
              className="text-[12px] flex items-center pt-2 justify-center text-gray-400/80">
              <strong className="h-2 w-2 bg-green-600 rounded"></strong>
              <strong className="pl-2 pr-1">1,000</strong>
              users online currently
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
