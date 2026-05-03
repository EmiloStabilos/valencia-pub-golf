interface Props {
  size?: number
  color?: string
  className?: string
}

export default function OrangeWreath({ size = 22, color = 'currentColor', className = '' }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      {/* Left half-wreath */}
      <path d="M12 22 C 6 20, 3 14, 4 8" />
      {/* Right half-wreath */}
      <path d="M12 22 C 18 20, 21 14, 20 8" />

      {/* Leaves — left branch */}
      <path d="M5.5 16 Q 3 15, 3 13" />
      <path d="M5 13 Q 2 12, 2 10" />
      <path d="M4.5 10 Q 2 9, 3 6" />
      <path d="M7 18 Q 8.5 18, 9 16" />
      <path d="M5.5 14.5 Q 7 14, 7.5 12" />

      {/* Leaves — right branch */}
      <path d="M18.5 16 Q 21 15, 21 13" />
      <path d="M19 13 Q 22 12, 22 10" />
      <path d="M19.5 10 Q 22 9, 21 6" />
      <path d="M17 18 Q 15.5 18, 15 16" />
      <path d="M18.5 14.5 Q 17 14, 16.5 12" />

      {/* Small orange at base */}
      <circle cx="12" cy="22" r="1" fill={color} stroke="none" />
      {/* Small oranges on branches */}
      <circle cx="4" cy="11" r="1" fill={color} stroke="none" />
      <circle cx="20" cy="11" r="1" fill={color} stroke="none" />
    </svg>
  )
}
