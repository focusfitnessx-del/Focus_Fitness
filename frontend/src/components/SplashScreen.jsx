import { useEffect, useState } from 'react'
import { Dumbbell } from 'lucide-react'

export default function SplashScreen({ onDone }) {
  const [fading, setFading] = useState(false)

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFading(true), 1600)
    const doneTimer = setTimeout(() => onDone?.(), 2050)
    return () => { clearTimeout(fadeTimer); clearTimeout(doneTimer) }
  }, [onDone])

  return (
    <div
      style={{ transition: 'opacity 450ms ease' }}
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background ${fading ? 'opacity-0' : 'opacity-100'}`}
    >
      {/* Top accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-primary" />

      <div className="flex flex-col items-center select-none">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary mb-7 shadow-2xl shadow-primary/30">
          <Dumbbell className="h-10 w-10 text-white" strokeWidth={2} />
        </div>
        <h1 className="font-display font-bold text-4xl tracking-widest text-foreground uppercase">
          Focus Fitness
        </h1>
        <p className="text-muted-foreground text-xs tracking-[0.3em] uppercase mt-2">
          Gym Management
        </p>
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-14 w-28 h-px bg-border overflow-hidden rounded-full">
        <div
          className="h-full bg-primary"
          style={{ animation: 'splashProgress 1.6s ease-in-out forwards' }}
        />
      </div>

      <style>{`
        @keyframes splashProgress {
          from { width: 0%; }
          to   { width: 100%; }
        }
      `}</style>
    </div>
  )
}
