interface Props {
  height?: number
  color?: string
  className?: string
  strokeWidth?: number
}

export default function OrangeTree({
  height = 200,
  color = '#2C1509',
  className = '',
  strokeWidth = 1.3,
}: Props) {
  // Wider aspect ratio — orange trees are bushy, not column-like
  const width = (height * 0.56) | 0
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 90 160"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      {/* Ground line */}
      <line x1="28" y1="152" x2="62" y2="152" strokeWidth="1.8" />
      <line x1="22" y1="152" x2="26" y2="152" strokeWidth="0.8" opacity="0.4" />
      <line x1="64" y1="152" x2="68" y2="152" strokeWidth="0.8" opacity="0.4" />

      {/* Trunk — wide, organic */}
      <path d="M38 152 C37 140, 36 130, 35 118" />
      <path d="M52 152 C53 140, 54 130, 55 118" />
      {/* Trunk texture */}
      <path d="M40 148 C41 138, 42 128, 43 118" strokeWidth="0.5" opacity="0.3" />

      {/* Main branches spreading from trunk top (~y=118) */}
      {/* Far left */}
      <path d="M35 118 C22 102, 14 88, 10 72" />
      {/* Left */}
      <path d="M35 118 C28 104, 24 92, 24 78" />
      {/* Center-left */}
      <path d="M43 116 C38 102, 34 90, 32 76" />
      {/* Center */}
      <path d="M45 115 C45 100, 45 88, 45 74" />
      {/* Center-right */}
      <path d="M47 116 C52 102, 56 90, 58 76" />
      {/* Right */}
      <path d="M55 118 C62 104, 66 92, 66 78" />
      {/* Far right */}
      <path d="M55 118 C68 102, 76 88, 80 72" />

      {/* Canopy — organic, wide, bumpy outline suggesting leaf clusters */}
      <path d="
        M10 72
        C6 60, 8 46, 16 38
        C20 32, 28 26, 36 24
        C40 22, 44 22, 50 24
        C58 27, 66 32, 72 40
        C78 48, 82 58, 80 70
        C78 80, 72 90, 64 96
        C58 101, 50 104, 45 104
        C40 104, 32 101, 26 96
        C18 90, 12 82, 10 72
        Z
      " />

      {/* Oranges — vivid Valencian orange */}
      <circle cx="26" cy="48" r="6.5" fill="#E07020" stroke="none" />
      <circle cx="44" cy="34" r="6.5" fill="#E07020" stroke="none" />
      <circle cx="62" cy="46" r="6.5" fill="#E07020" stroke="none" />
      <circle cx="16" cy="68" r="6"   fill="#E07020" stroke="none" />
      <circle cx="38" cy="58" r="6.5" fill="#E07020" stroke="none" />
      <circle cx="60" cy="62" r="6"   fill="#E07020" stroke="none" />
      <circle cx="74" cy="68" r="6"   fill="#E07020" stroke="none" />
      <circle cx="26" cy="82" r="6"   fill="#E07020" stroke="none" />
      <circle cx="52" cy="80" r="6.5" fill="#E07020" stroke="none" />
      <circle cx="70" cy="84" r="5.5" fill="#E07020" stroke="none" />
      <circle cx="38" cy="92" r="5.5" fill="#E07020" stroke="none" />
      <circle cx="60" cy="94" r="5"   fill="#E07020" stroke="none" />
    </svg>
  )
}
