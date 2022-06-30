import cx from 'classnames'

export const imageS1: any = new URL('./assets/tutorials-1.png', import.meta.url)
export const imageLogo: any = new URL('./assets/logo2.png', import.meta.url)
export const imageProductHuntLogo: any = new URL('./assets/product_hunt_logo.png', import.meta.url)

export function FloatGlassButton (
  props: any,
) {
  const { href, children, className, ...rest } = props

  if (href) {
    rest.onClick = () => {
      window?.open(
        href, '_blank'
      )
    }
  }

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