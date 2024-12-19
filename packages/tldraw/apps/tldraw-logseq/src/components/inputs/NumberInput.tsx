interface NumberInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
}

export function NumberInput({ label, ...rest }: NumberInputProps) {
  return (
    <div className="input">
      <label htmlFor={`number-${label}`}>{label}</label>
      <input className="number-input" name={`number-${label}`} type="number" {...rest} />
    </div>
  )
}
