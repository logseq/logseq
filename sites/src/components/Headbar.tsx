import { Link, NavLink } from 'react-router-dom'
import { ArrowSquareOut, List, X } from 'phosphor-react'
import { ReactElement, useEffect, useState } from 'react'
import { WrapGlobalDownloadButton } from '../pages/Downloads'
import cx from 'classnames'

export function LinksGroup (
  props: {
    items: Array<{ link: string, label: string | ReactElement, icon?: ReactElement }>,

    [k: string]: any
  },
) {
  const { items, className, ...rest } = props

  return (
    <ul className={cx('links-group sm:ml-6 h-full', className)}
        {...rest}
    >
      {items.map(it => {
        const inner = (
          <>
            {it.label}
            {it.icon && <span
              className={'pl-2 opacity-40 group-hover:opacity-80'}>{it.icon}</span>}
          </>)

        return (
          <li className={'flex items-center'}
              key={it.label.toString()}
          >
            {it.link.startsWith('http')
              ?
              <a href={it.link} target={'_blank'}
                 className={'h-full flex items-center group transition-colors'}>{inner}</a>
              :
              <NavLink
                to={it.link}
                className={({ isActive }) => {
                  return cx('h-full flex items-center group transition-colors',
                    isActive && 'app-link-active')
                }}>{inner}</NavLink>
            }

          </li>
        )
      })}
    </ul>
  )
}

export function Headbar () {
  const [rightActive, setRightActive] = useState(false)

  useEffect(() => {
    const outsideHandler = (e: MouseEvent) => {
      const target = e.target as any
      const isToggle = !!target.closest('a.nav-toggle')

      if (isToggle) {
        return setRightActive(!rightActive)
      }

      rightActive && setRightActive(false)
    }

    document.body.addEventListener('click', outsideHandler)

    return () => {
      document.body.removeEventListener('click', outsideHandler)
    }
  }, [rightActive])

  useEffect(() => {
    if (rightActive) {
      document.body.classList.add('is-nav-open')
    } else {
      document.body.classList.remove('is-nav-open')
    }
  }, [rightActive])

  const leftLinks = [
    { label: 'Home', link: '/' },
    { label: 'Downloads', link: '/downloads' },
  ]

  const rightLinks = [
    {
      label: 'Jobs',
      link: 'https://blog.logseq.com/jobs',
      icon: <ArrowSquareOut size={15} weight={'bold'}/>,
    },
    {
      label: 'Community Hub',
      link: 'https://hub.logseq.com',
      icon: <ArrowSquareOut size={15} weight={'bold'}/>,
    },
    {
      label: 'Blog',
      link: 'https://blog.logseq.com',
      icon: <ArrowSquareOut size={15} weight={'bold'}/>,
    },
  ]

  return (
    <div className={'app-headbar h-14 flex justify-center'}>
      <div className={'flex items-center justify-between w-full'}>
        <div className={'flex items-center h-full flex-1'}>
          <Link to={'/'} className={'app-logo-link mr-2'}></Link>

          <LinksGroup
            className={'justify-center sm:justify-start'}
            items={leftLinks}/>
        </div>

        <div className={cx('right-group flex items-center h-full', {
          ['is-active']: rightActive
        })}>
          <a className={'nav-toggle flex h-full items-center sm:hidden'}>
            {rightActive ?
              <X size={24} weight={'bold'}></X> :
              <List size={24} weight={'bold'}></List>}
          </a>

          <div className={'right-group-inner'}>
            <LinksGroup
              className={'justify-center space-x-2 py-6 w-full mx-1 border-t border-t-logseq-500 sm:mr-0'}
              items={rightLinks}
            />

            {/*Downloads select*/}
            <div className="downloads-select mt-2 sm:ml-8 sm:mt-0">
              <WrapGlobalDownloadButton>
                {({ active, rightIconFn, leftIconFn }: any) => {

                  return (
                    <a
                      className={'flex items-center bg-sky-600 px-2 py-1 rounded text-sm hover:opacity-80 select-none cursor-pointer'}>
                      {typeof leftIconFn === 'function'
                        ? leftIconFn({ weight: 'bold' })
                        : leftIconFn}
                      <span className={'pl-2'}>Download for {active?.[0]}</span>
                      {rightIconFn?.()}
                    </a>
                  )
                }}
              </WrapGlobalDownloadButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
