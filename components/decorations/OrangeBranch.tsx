interface Props {
  size?: number
  color?: string
  className?: string
  mirrored?: boolean
}

export default function OrangeBranch({ size = 60, color = '#B89A60', className = '', mirrored = false }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      stroke={color}
      strokeWidth="1.2"
      strokeLinecap="round"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={mirrored ? { transform: 'scaleX(-1)' } : undefined}
      aria-hidden
    >
      {/* Main branch */}
      <path d="M70 64 C 50 56, 30 44, 14 22" strokeWidth="1.4" />

      {/* Leaves */}
      <path d="M58 50 Q 48 38, 58 30" />
      <path d="M46 40 Q 36 28, 48 22" />
      <path d="M34 30 Q 24 18, 36 12" />
      <path d="M64 60 Q 60 70, 70 74" />
      <path d="M52 50 Q 48 62, 58 66" />
      <path d="M40 40 Q 36 52, 48 56" />
      <path d="M28 28 Q 24 40, 36 44" />

      {/* Oranges */}
      <circle cx="52" cy="42" r="5.5" fill="#E07020" stroke="none" />
      <circle cx="38" cy="30" r="5" fill="#E07020" stroke="none" />
      <circle cx="26" cy="20" r="4.5" fill="#E07020" stroke="none" />
      <circle cx="64" cy="56" r="4.5" fill="#E07020" stroke="none" />
    </svg>
  )
}
