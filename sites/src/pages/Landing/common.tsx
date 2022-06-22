import cx from 'classnames'

export const imageS1: any = new URL('./assets/tutorials-1.png', import.meta.url)
export const imageLogo: any = new URL('./assets/logo2.png', import.meta.url)

export function FloatGlassButton (
  props: any,
) {
  const { children, className, ...rest } = props

  return (
    <div className={cx('glass-btn', className)} {...rest}>
      {children}
    </div>
  )
}

export function AppLogo (
  props: any
) {
  const { className, ...rest } = props

  return (
    <div className={cx('app-logo', className)} {...rest}>
      <img src={imageLogo} alt="Logseq"/>
    </div>
  )
}