'use client'
export default function LoadingScreen({ message = 'Loading', progress = 0 }: { message?: string; progress?: number }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6"
      style={{ background: 'var(--paper)' }}>
      <div className="text-center">
        <h1 className="font-display font-black tracking-tight"
          style={{ color: 'var(--ink-black)', fontSize: 'clamp(2rem, 5vw, 4rem)' }}>
          Industry<span style={{ color: 'var(--accent-red)' }}>·</span>Intelligence
        </h1>
        <div className="mt-1" style={{ borderTop: '4px solid var(--ink-black)' }} />
      </div>
      <div className="flex flex-col items-center gap-3">
        <p className="font-body text-sm" style={{ color: 'var(--ink-muted)' }}>{message}</p>
        <div className="w-48 h-px overflow-hidden" style={{ background: 'var(--rule)' }}>
          <div className="h-full transition-all duration-700" style={{ width: `${progress}%`, background: 'var(--ink-black)' }} />
        </div>
        <span className="font-mono text-xxs" style={{ color: 'var(--ink-faint)' }}>{progress}%</span>
      </div>
      <style>{`@keyframes blink{0%,100%{opacity:.2}50%{opacity:1}}`}</style>
    </div>
  )
}
