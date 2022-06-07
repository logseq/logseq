import { AppleLogo, ArrowSquareOut, CaretDown, CircleWavyQuestion, PlayCircle } from 'phosphor-react'
import { LSButton } from '../../components/Buttons'

export function HeadShowcase () {
  return (
    <div className={'app-head-showcase'}>
      <div className="inner flex h-full">
        <div className="item-wrap relative flex-1">
          {/* text layer*/}
          <div className="text-1 z-0 w-full flex flex-col items-center tracking-wide">
            <span className="text-6xl opacity-70">Connect your notes, </span>
            <strong className="flex text-6xl">
              increase understanding.
              <sup className="translate-y-4 opacity-80">
                <CircleWavyQuestion size={'18'}/>
              </sup>
            </strong>
          </div>

          {/* image layer */}
          <div className="image-2 z-10 thinker absolute">
          </div>

          {/* cards layer */}
          <div className="cards-3 z-20">

          </div>

          {/*  action buttons */}
          <div className="actions-4 z-30 flex space-x-4">
            <LSButton
              leftIcon={<AppleLogo size={18} weight={'bold'}/>}
              rightIcon={<CaretDown size={18} className={'opacity-70'}/>}
            >
              Download for Mac
            </LSButton>

            <LSButton
              leftIcon={<PlayCircle size={18} weight={'bold'}/>}
              rightIcon={<ArrowSquareOut className={'opacity-70'}/>}
              className={'bg-logseq-600'}
            >
              Live Demo
            </LSButton>
          </div>
        </div>
      </div>
    </div>
  )
}