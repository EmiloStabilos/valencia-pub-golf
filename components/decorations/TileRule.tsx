interface Props {
  wide?: boolean
}

export default function TileRule({ wide = false }: Props) {
  const w = wide ? 100 : 50
  return (
    <div className="flex items-center gap-2 justify-center my-2.5">
      <div style={{ width: w, height: 1, background: 'var(--gold)', opacity: 0.6 }} />
      <svg viewBox="0 0 12 12" width={10} height={10}>
        <rect x={3} y={3} width={6} height={6} style={{ fill: 'var(--gold)' }} opacity={0.7} transform="rotate(45 6 6)" />
      </svg>
      <div style={{ width: w, height: 1, background: 'var(--gold)', opacity: 0.6 }} />
    </div>
  )
}
