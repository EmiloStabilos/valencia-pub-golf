interface Props {
  size?: number
  color?: string
  className?: string
}

/** Small orange fruit — replaces amphora as inline sip-count icon */
export default function OrangeDecor({ size = 24, color = '#1A2438', className = '' }: Props) {
  return (
    <svg
      width={size}
      height={(size * 1.2) | 0}
      viewBox="0 0 24 28"
      fill="none"
      stroke={color}
      strokeWidth="1.1"
      strokeLinecap="round"
      strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      {/* Stem */}
      <line x1="12" y1="6" x2="12" y2="2" />
      {/* Leaf */}
      <path d="M12 4 Q 17 2, 18 5 Q 15 7, 12 4" />
      {/* Fruit body */}
      <circle cx="12" cy="17" r="9" />
      {/* Navel (bottom dimple) */}
      <circle cx="12" cy="24.5" r="1.2" fill="none" />
      {/* Segment lines (subtle) */}
      <line x1="12" y1="8" x2="12" y2="26" strokeWidth="0.5" opacity="0.4" />
      <line x1="3.5" y1="13.5" x2="20.5" y2="20.5" strokeWidth="0.5" opacity="0.4" />
      <line x1="3.5" y1="20.5" x2="20.5" y2="13.5" strokeWidth="0.5" opacity="0.4" />
    </svg>
  )
}
