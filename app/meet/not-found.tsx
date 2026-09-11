import MeetHeader from '@/components/meet/MeetHeader'

export default function MeetNotFound() {
  return (
    <div className="meet-ui min-h-screen bg-black">
      <MeetHeader />
      <main className="mx-auto max-w-[1024px] px-5 pb-32 pt-[144px] sm:px-8">
        <p className="meet-eyebrow">Drama Meet</p>
        <h1 className="meet-display mt-4 text-[clamp(40px,7.5vw,90px)] leading-[0.9]">
          Este link
          <br />
          no existe.
        </h1>
        <div className="meet-rule my-[30px]" />
        <p className="max-w-[520px] text-[19px] leading-[1.5] text-white/70">
          Puede que la reunión se haya dado de baja. Pedile el link nuevo a quien te invitó.
        </p>
      </main>
    </div>
  )
}
