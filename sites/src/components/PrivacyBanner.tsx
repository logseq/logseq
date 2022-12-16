import { Button } from './Buttons'
import { XCircle } from 'phosphor-react'
import { useEffect, useState } from 'react'
import Cookie from 'js-cookie'

export function PrivacyBanner() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (
      sessionStorage?.getItem('__pb') == '1' ||
      localStorage?.getItem('__pb') == '1'
    ) return

    setTimeout(() => {
      setReady(true)
    }, 1500)
  }, [])

  const closeBannerSession = () => {
    sessionStorage?.setItem('__pb', '1')
    setReady(false)
  }

  const acceptHandler = () => {
    localStorage?.setItem('__pb', '1')
    Cookie.set(`__pb`, '1', { expires: 7 })
    setReady(false)
  }

  const denyHandler = () => {
    closeBannerSession()
  }

  return (
    <>
      {ready ?
        (<div className={'app-privacy-banner ani-slide-in-from-bottom'}>
          <div className="inner flex max-w-screen-xl flex-col sm:flex-row">
            <div className="l px-8 opacity-80">
              By clicking “Accept All Cookies”, you agree to the storing of
              cookies
              on
              your device to enhance site navigation, and analyze site usage.
              View our <a
              className={'text-logseq-100 hover:underline'}
              href={'https://docs.logseq.com/#/page/Privacy%20Policy'}
              target={'_blank'}
            >Privacy Policy</a> for more.
            </div>

            <div className="r">
              <Button className={'sm:w-[120px] bg-logseq-600/50'}
                      onClick={denyHandler}>Deny</Button>
              <Button className={'sm:w-[120px]'}
                      onClick={acceptHandler}>Accept</Button>
              <Button className={'leading-0 bg-transparent opacity-50'}
                      onClick={closeBannerSession}
              >
                <XCircle size={24}/>
              </Button>
            </div>
          </div>
        </div>) : null
      }
    </>
  )
}
