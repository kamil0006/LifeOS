import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useLearning } from '../context/LearningContext'
import type { SessionType } from '../context/LearningContext'

export const POMODORO_MODES = [
  { label: '30 min', minutes: 30 },
  { label: '1 h', minutes: 60 },
  { label: '1.5 h', minutes: 90 },
  { label: '2 h', minutes: 120 },
] as const

export const POMODORO_RING = {
  SIZE: 280,
  CX: 140,
  RADIUS: 124,
  STROKE: 12,
} as const

const CIRCUMFERENCE = 2 * Math.PI * POMODORO_RING.RADIUS

function playBeep() {
  try {
    const ctx = new (window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    const schedule = (freq: number, start: number, dur: number) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start)
      gain.gain.setValueAtTime(0.3, ctx.currentTime + start)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur)
      osc.start(ctx.currentTime + start)
      osc.stop(ctx.currentTime + start + dur)
    }
    schedule(880, 0, 0.3)
    schedule(1100, 0.35, 0.3)
    schedule(880, 0.7, 0.5)
  } catch {
    /* Web Audio lub autoplay niedostępny */
  }
}

type Snapshot = { topic: string; sessionType: SessionType; selectedMinutes: number }

/**
 * Stan i efekty timera Pomodoro + zapis sesji do LearningContext po zakończeniu.
 * UI zostaje w komponencie prezentacyjnym.
 */
export function usePomodoroTimer() {
  const learning = useLearning()

  const [selectedMinutes, setSelectedMinutes] = useState(30)
  const [timeLeft, setTimeLeft] = useState(30 * 60)
  const [isRunning, setIsRunning] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [started, setStarted] = useState(false)
  const [topic, setTopic] = useState('')
  const [sessionType, setSessionType] = useState<SessionType>('praktyka')

  const snapshotRef = useRef<Snapshot>({
    topic: '',
    sessionType: 'praktyka',
    selectedMinutes: 30,
  })
  useEffect(() => {
    snapshotRef.current = { topic, sessionType, selectedMinutes }
  }, [topic, sessionType, selectedMinutes])

  const learningRef = useRef(learning)
  useEffect(() => {
    learningRef.current = learning
  }, [learning])

  const completeSession = useCallback(() => {
    const { topic: t, sessionType: st, selectedMinutes: mins } = snapshotRef.current
    const L = learningRef.current
    if (L) {
      L.addSession({
        date: new Date().toISOString().split('T')[0],
        minutes: mins,
        topic: t.trim() || 'Sesja pomodoro',
        type: st,
        note: `Pomodoro ${mins} min`,
      })
    }
    playBeep()
    setCompleted(true)
  }, [])

  useEffect(() => {
    if (!isRunning) return
    const intervalId = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(intervalId)
          queueMicrotask(() => {
            setIsRunning(false)
            completeSession()
          })
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => window.clearInterval(intervalId)
  }, [isRunning, completeSession])

  const handleModeChange = useCallback(
    (mins: number) => {
      if (isRunning) return
      setSelectedMinutes(mins)
      setTimeLeft(mins * 60)
      setCompleted(false)
      setStarted(false)
    },
    [isRunning],
  )

  const handleReset = useCallback(() => {
    setIsRunning(false)
    setTimeLeft(selectedMinutes * 60)
    setCompleted(false)
    setStarted(false)
  }, [selectedMinutes])

  const pause = useCallback(() => setIsRunning(false), [])
  const startOrResume = useCallback(() => {
    setStarted(true)
    setIsRunning(true)
  }, [])

  const totalSeconds = selectedMinutes * 60
  const progress = totalSeconds > 0 ? timeLeft / totalSeconds : 1
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress)

  const ringColor = useMemo(() => {
    if (completed) return 'var(--accent-green)'
    if (progress > 0.5) return 'var(--accent-cyan)'
    if (progress > 0.25) return 'var(--accent-amber)'
    return '#e74c3c'
  }, [completed, progress])

  const minutesDisplay = Math.floor(timeLeft / 60)
  const secondsDisplay = timeLeft % 60

  const sessionCategories = learning?.sessionCategories ?? []

  return {
    selectedMinutes,
    timeLeft,
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
    circumference: CIRCUMFERENCE,
  }
}
