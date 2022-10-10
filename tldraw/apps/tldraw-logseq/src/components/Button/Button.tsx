export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
}

export function Button(props: ButtonProps) {
  return <button className="tl-button" {...props} />
}
