type Props = {
  text: string
  bg?: string
  color?: string
  speed?: number
}

export default function Ticker({ text, bg = '#000', color = '#fff', speed = 25 }: Props) {
  const repeated = Array(8).fill(`${text} • `).join('')

  return (
    <div
      className="overflow-hidden py-3 md:py-4"
      style={{ backgroundColor: bg }}
    >
      <div
        className="ticker-track text-sm md:text-base font-bold uppercase tracking-widest select-none"
        style={{
          color,
          animationDuration: `${speed}s`,
        }}
      >
        <span>{repeated}</span>
        <span aria-hidden>{repeated}</span>
      </div>
    </div>
  )
}
