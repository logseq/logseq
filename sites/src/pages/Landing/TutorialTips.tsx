import { FloatGlassButton, imageS1 } from './common'
import {
  AlignLeft,
  ArrowArcLeft,
  ArrowArcRight,
  ArrowCircleLeft, ArrowCircleRight, FrameCorners, StarFour,
} from 'phosphor-react'
import { LSButton } from '../../components/Buttons'

export function TutorialTips () {
  return (
    <div className="app-tutorial-tips">
      <div className="hd flex flex-col justify-center items-center">
        <h1>
          Braindump everything into Logseq
        </h1>
        <h2>
          New ideas will pop up with time.
        </h2>
        <h3>
          Using Logseq helps you organize your thoughts and ideas
        </h3>
        <h4>
          <span className="opacity-60">so that you can</span>
          <span className="opacity-100 pl-1">
            come up with new outputs more easily.
          </span>
        </h4>
      </div>

      <div className="bd flex">
        <div className="bd-slides">
          <div className="items flex">
            <div className="item a">
              {/*  Beginner */}
              <h1 className="flex">
                <strong className="text-3xl pr-4">✍️</strong>
                <LSButton
                  className={'text-sm'}
                  leftIcon={<StarFour size={16}/>}
                >
                  Beginner
                </LSButton></h1>
            </div>
          </div>

          <div className="actions flex">
            <span className="opacity-70">
              <ArrowCircleLeft size={26}/>
            </span>

            <span className="opacity-70">
              <ArrowCircleRight size={26}/>
            </span>
          </div>
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
    </div>
  )
}
