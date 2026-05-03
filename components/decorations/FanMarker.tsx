interface Props {
  size?: number
  color?: string
  className?: string
}

/** Spanish abanico (fan) pictogram — replaces temple marker for map links and waypoints */
export default function FanMarker({ size = 16, color = 'currentColor', className = '' }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke={color}
      strokeWidth="1.1"
      strokeLinecap="round"
      strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      {/* Fan arc */}
      <path d="M2 13 A9 9 0 0 1 14 13" fill={color} fillOpacity="0.12" />
      {/* Outer border arc */}
      <path d="M2 13 A9 9 0 0 1 14 13" />
      {/* Pivot */}
      <circle cx="8" cy="13" r="1" fill={color} />
      {/* Radiating ribs */}
      <line x1="8" y1="13" x2="2" y2="13" />
      <line x1="8" y1="13" x2="3.2" y2="8.5" />
      <line x1="8" y1="13" x2="5.7" y2="5.5" />
      <line x1="8" y1="13" x2="8" y2="4.2" />
      <line x1="8" y1="13" x2="10.3" y2="5.5" />
      <line x1="8" y1="13" x2="12.8" y2="8.5" />
      <line x1="8" y1="13" x2="14" y2="13" />
    </svg>
  )
}
