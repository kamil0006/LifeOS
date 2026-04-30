import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Play, Pause, RotateCcw, CheckCircle2, X, Timer } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { SESSION_TYPE_OPTIONS } from '../../pages/Learning/learningUtils'
import { usePomodoroTimer, POMODORO_MODES, POMODORO_RING } from '../../hooks/usePomodoroTimer'

function pad(n: number) {
  return String(n).padStart(2, '0')
}

const { SIZE, CX, RADIUS, STROKE } = POMODORO_RING

// ─── MODAL (prezentacja) ────────────────────────────────────────────────────────

function PomodoroModal({ onClose }: { onClose: () => void }) {
  const {
    selectedMinutes,
    isRunning,
    completed,
    started,
    topic,
    setTopic,
    sessionType,
    setSessionType,
    handleModeChange,
    handleReset,
    pause,
    startOrResume,
    progress,
    strokeDashoffset,
    ringColor,
    minutesDisplay,
    secondsDisplay,
    sessionCategories,
    circumference,
  } = usePomodoroTimer()

  const handleClose = () => {
    pause()
    onClose()
  }

  return createPortal(
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-9998 bg-black/75 backdrop-blur-sm"
        onClick={!isRunning ? handleClose : undefined}
      />
      <div className="fixed inset-0 z-9999 flex items-center justify-center p-4 pointer-events-none">
        <motion.div
          initial={{ scale: 0.88, opacity: 0, y: 24 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.88, opacity: 0, y: 24 }}
          transition={{ type: 'spring', damping: 20, stiffness: 280 }}
          className="pointer-events-auto relative w-full max-w-md rounded-2xl border border-(--border) bg-(--bg-card) shadow-[0_0_60px_rgba(0,0,0,0.6)] overflow-hidden"
        >
          <div
            className="h-1 w-full transition-colors duration-500"
            style={{ background: ringColor }}
          />

          <div className="p-7">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2.5">
                <Timer className="w-6 h-6 text-(--accent-cyan)" />
                <h3 className="text-xl font-bold font-gaming text-(--text-primary) tracking-wide">
                  Timer nauki
                </h3>
                {isRunning && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-gaming bg-(--accent-cyan)/15 text-(--accent-cyan) border border-(--accent-cyan)/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-(--accent-cyan) animate-pulse" />
                    live
                  </span>
                )}
              </div>
              <button
                onClick={handleClose}
                className="p-2 rounded-lg text-(--text-muted) hover:text-(--text-primary) hover:bg-(--bg-dark) transition-colors"
                aria-label="Zamknij"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2 mb-8">
              {POMODORO_MODES.map((m) => (
                <button
                  key={m.minutes}
                  type="button"
                  onClick={() => handleModeChange(m.minutes)}
                  disabled={isRunning}
                  className={`py-2.5 rounded-xl font-gaming text-sm font-semibold transition-all disabled:cursor-not-allowed ${
                    selectedMinutes === m.minutes
                      ? 'bg-(--accent-cyan)/20 text-(--accent-cyan) border-2 border-(--accent-cyan)/60 shadow-[0_0_12px_rgba(0,229,255,0.2)]'
                      : 'bg-(--bg-dark) text-(--text-muted) border-2 border-(--border) hover:border-(--accent-cyan)/40 hover:text-(--text-primary) disabled:opacity-35'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            <div className="flex justify-center mb-7">
              <div className="relative" style={{ width: SIZE, height: SIZE }}>
                {isRunning && !completed && (
                  <motion.div
                    animate={{ opacity: [0.35, 0.7, 0.35] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: `radial-gradient(circle, ${ringColor}22 0%, transparent 70%)`,
                    }}
                  />
                )}

                <svg
                  width={SIZE}
                  height={SIZE}
                  viewBox={`0 0 ${SIZE} ${SIZE}`}
                  className="-rotate-90"
                >
                  <circle
                    cx={CX}
                    cy={CX}
                    r={RADIUS}
                    fill="none"
                    stroke="var(--border)"
                    strokeWidth={STROKE}
                  />
                  <circle
                    cx={CX}
                    cy={CX}
                    r={RADIUS}
                    fill="none"
                    stroke={ringColor}
                    strokeWidth={STROKE}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    style={{ transition: 'stroke-dashoffset 0.95s linear, stroke 0.4s ease' }}
                  />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                  {completed ? (
                    <motion.div
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', damping: 12 }}
                      className="flex flex-col items-center gap-2"
                    >
                      <CheckCircle2
                        className="w-20 h-20"
                        style={{ color: 'var(--accent-green)' }}
                      />
                      <span className="font-gaming text-base text-(--accent-green)">
                        Ukończono!
                      </span>
                    </motion.div>
                  ) : (
                    <>
                      <span
                        className="font-mono font-black tabular-nums leading-none text-(--text-primary)"
                        style={{ fontSize: '4.5rem', letterSpacing: '-0.02em' }}
                      >
                        {pad(minutesDisplay)}:{pad(secondsDisplay)}
                      </span>
                      <span
                        className="font-gaming tracking-widest uppercase text-sm"
                        style={{ color: ringColor }}
                      >
                        {isRunning ? 'w trakcie' : started ? 'pauza' : 'gotowy'}
                      </span>
                      <span className="text-xs text-(--text-muted) font-mono mt-0.5">
                        {Math.round(progress * 100)}% pozostało
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {completed ? (
              <div className="text-center space-y-4">
                <p className="text-lg font-gaming text-(--text-primary)">
                  Brawo! Sesja{' '}
                  <span className="text-(--accent-green) font-bold">{selectedMinutes} min</span>{' '}
                  dodana do historii.
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="flex-1 py-3 rounded-xl border-2 border-(--border) text-(--text-muted) font-gaming font-semibold hover:bg-(--bg-dark) hover:text-(--text-primary) transition-colors"
                  >
                    Nowa sesja
                  </button>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 py-3 rounded-xl font-gaming font-bold text-base hover:opacity-90 transition-opacity"
                    style={{ background: 'var(--accent-green)', color: 'var(--bg-dark)' }}
                  >
                    Zamknij
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Temat sesji — co dzisiaj uczysz?"
                    className="w-full px-4 py-3 rounded-xl bg-(--bg-dark) border-2 border-(--border) text-(--text-primary) font-gaming focus:border-(--accent-cyan)/60 focus:outline-none transition-colors placeholder:text-(--text-muted)/60"
                  />
                </div>

                {sessionCategories.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {sessionCategories.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setTopic((prev) => (prev === cat ? '' : cat))}
                        className={`px-3 py-1.5 rounded-lg font-gaming text-sm transition-colors border ${
                          topic === cat
                            ? 'bg-(--accent-cyan)/20 text-(--accent-cyan) border-(--accent-cyan)/50'
                            : 'bg-(--bg-dark) text-(--text-muted) border-(--border) hover:border-(--accent-cyan)/40 hover:text-(--text-primary)'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap gap-2 mb-7">
                  {SESSION_TYPE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setSessionType(opt.value)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-gaming text-sm transition-colors border ${
                        sessionType === opt.value
                          ? 'bg-(--accent-cyan)/20 text-(--accent-cyan) border-(--accent-cyan)/50'
                          : 'bg-(--bg-dark) text-(--text-muted) border-(--border) hover:border-(--accent-cyan)/40 hover:text-(--text-primary)'
                      }`}
                    >
                      <opt.icon className="w-3.5 h-3.5" />
                      {opt.label}
                    </button>
                  ))}
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleReset}
                    disabled={!started}
                    className="flex items-center justify-center w-14 h-14 rounded-xl border-2 border-(--border) text-(--text-muted) hover:text-(--text-primary) hover:bg-(--bg-dark) transition-colors disabled:opacity-25 disabled:cursor-not-allowed shrink-0"
                    aria-label="Reset"
                  >
                    <RotateCcw className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={isRunning ? pause : startOrResume}
                    className="flex-1 flex items-center justify-center gap-3 h-14 rounded-xl font-gaming font-bold text-lg hover:opacity-90 active:scale-[0.98] transition-all"
                    style={{
                      background: isRunning ? 'var(--accent-amber)' : 'var(--accent-cyan)',
                      color: 'var(--bg-dark)',
                      boxShadow: isRunning
                        ? '0 0 20px rgba(255,193,7,0.35)'
                        : '0 0 20px rgba(0,229,255,0.35)',
                    }}
                  >
                    {isRunning ? (
                      <>
                        <Pause className="w-6 h-6" />
                        Pauza
                      </>
                    ) : (
                      <>
                        <Play className="w-6 h-6" />
                        {started ? 'Wznów' : 'Start'}
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </>,
    document.body,
  )
}

// ─── PUBLIC API ────────────────────────────────────────────────────────────────

export function PomodoroCardButton() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-between px-5 py-5 rounded-xl border border-(--accent-cyan)/30 bg-(--accent-cyan)/5 hover:bg-(--accent-cyan)/10 hover:border-(--accent-cyan)/60 transition-all group"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-(--accent-cyan)/15 flex items-center justify-center group-hover:bg-(--accent-cyan)/25 transition-colors shrink-0">
            <Timer className="w-6 h-6 text-(--accent-cyan)" />
          </div>
          <div className="text-left">
            <p className="font-gaming font-bold text-(--text-primary) text-base tracking-wide">
              Timer nauki
            </p>
            <p className="text-sm text-(--text-muted) mt-0.5">
              30 min &nbsp;·&nbsp; 1 h &nbsp;·&nbsp; 1.5 h &nbsp;·&nbsp; 2 h
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-(--accent-cyan) opacity-70 group-hover:opacity-100 transition-opacity">
          <span className="font-gaming text-sm hidden sm:block">Uruchom</span>
          <Play className="w-5 h-5" />
        </div>
      </button>
      <AnimatePresence>
        {open && <PomodoroModal key="pomodoro" onClose={() => setOpen(false)} />}
      </AnimatePresence>
    </>
  )
}

export function PomodoroInlineButton() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-(--accent-cyan)/10 border border-(--accent-cyan)/30 text-(--accent-cyan) font-gaming text-sm hover:bg-(--accent-cyan)/20 transition-colors"
        title="Uruchom timer"
      >
        <Timer className="w-3.5 h-3.5" />
        Timer
      </button>
      <AnimatePresence>
        {open && <PomodoroModal key="pomodoro" onClose={() => setOpen(false)} />}
      </AnimatePresence>
    </>
  )
}
