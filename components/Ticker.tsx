type Props = {
  text: string
  bg?: string
  color?: string
  speed?: number
}

export default function Ticker({ text, bg = '#000', color = '#fff', speed = 25 }: Props) {
  const repeated = Array.from({ length: 8 }, (_, index) => index)

  const renderTickerGroup = (groupIndex: number) => (
    <span className="flex shrink-0 items-center" aria-hidden={groupIndex > 0}>
      {repeated.map((item) => (
        <span key={`${groupIndex}-${item}`} className="flex items-center">
          <span>{text}</span>
          <span className="px-4 md:px-5">•</span>
        </span>
      ))}
    </span>
  )

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
        {renderTickerGroup(0)}
        {renderTickerGroup(1)}
      </div>
    </div>
  )
}
