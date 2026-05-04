interface Props {
  color?: string
  bg?: string
}

export default function ArchDivider({ color = 'rgba(26,74,122,0.4)', bg = '#F5F1EB' }: Props) {
  const xValues = [0, 65, 130, 195, 260, 325]
  return (
    <svg
      viewBox="0 0 390 20"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', width: '100%', height: 20 }}
    >
      {xValues.map((x, i) => (
        <path
          key={i}
          d={`M${x} 20 Q${x + 32.5} 0 ${x + 65} 20`}
          fill={bg}
          stroke={color}
          strokeWidth="0.8"
        />
      ))}
      <line x1="0" y1="20" x2="390" y2="20" stroke={color} strokeWidth="0.8" />
    </svg>
  )
}
