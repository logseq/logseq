export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
}

export function Button({ className, ...rest }: ButtonProps) {
  return <button className={'tl-button ' + (className ?? '')} {...rest} />
}
