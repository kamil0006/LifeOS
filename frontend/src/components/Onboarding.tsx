import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Wallet,
  Calendar as CalendarIcon,
  CheckSquare,
  
  Target,
  
  Sparkles,
} from 'lucide-react'
import { useOnboarding } from '../context/OnboardingContext'

const STEPS = [
  {
    icon: Sparkles,
    title: 'Witaj w LifeOS',
    desc: 'Twoja centrala do zarządzania życiem – finanse, organizacja i rozwój w jednym miejscu.',
    path: '/dashboard',
  },
  {
    icon: LayoutDashboard,
    title: 'Dashboard',
    desc: 'Przegląd finansów, wydatków, przychodów i aktywności. Wszystkie kluczowe dane na jednym ekranie.',
    path: '/dashboard',
  },
  {
    icon: Wallet,
    title: 'Finanse',
    desc: 'Wydatki, przychody, stałe koszty, zachcianki i wartość netto. Pełna kontrola nad budżetem.',
    path: '/finances',
  },
  {
    icon: CalendarIcon,
    title: 'Organizacja',
    desc: 'Kalendarz z wydarzeniami, listy To-do oraz notatki – szybkie notatki, pomysły i referencje.',
    path: '/calendar',
  },
  {
    icon: Target,
    title: 'Rozwój',
    desc: 'Nawyki, cele, nauka (kursy, książki, projekty) oraz osiągnięcia – śledź swój postęp.',
    path: '/habits',
  },
  {
    icon: CheckSquare,
    title: 'Gotowy?',
    desc: 'Zacznij od Dashboard lub użyj wyszukiwania (Ctrl+K), aby szybko znaleźć dowolną sekcję.',
    path: '/dashboard',
  },
]

export function Onboarding() {
  const { isOpen, close } = useOnboarding()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (isOpen) setStep(0)
  }, [isOpen])

  useEffect(() => {
    if (isOpen && STEPS[step]?.path) {
      navigate(STEPS[step].path)
    }
  }, [isOpen, step, navigate])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, close])

  const handleDismiss = useCallback(() => close(), [close])

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1)
    } else {
      handleDismiss()
    }
  }

  const handlePrev = () => {
    if (step > 0) setStep((s) => s - 1)
  }

  if (!isOpen) return null

  const current = STEPS[step]
  const Icon = current.icon
  const isFirst = step === 0
  const isLast = step === STEPS.length - 1

  const modalContent = (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-9998 flex items-start justify-start pt-8 lg:pt-10 pl-68 pr-4 sm:pr-6 pb-4 bg-black/25"
        onClick={handleDismiss}
      >
        <motion.div
          key={step}
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full min-w-[min(100%,20rem)] max-w-md rounded-xl border border-(--border) bg-(--bg-card) p-6 shadow-xl"
        >
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-(--text-muted) hover:text-(--text-primary) hover:bg-(--bg-dark) transition-colors"
            aria-label="Zamknij"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col items-center text-center pt-2">
            <div className="w-14 h-14 rounded-xl bg-(--accent-cyan)/15 border border-(--accent-cyan)/40 flex items-center justify-center mb-4">
              <Icon className="w-7 h-7 text-(--accent-cyan)" />
            </div>
            <h2 className="text-xl font-bold text-(--text-primary) font-gaming tracking-wider">
              {current.title}
            </h2>
            <p className="text-base text-(--text-muted) mt-3 leading-relaxed">
              {current.desc}
            </p>
          </div>

          <div className="flex items-center justify-between mt-8 gap-3 min-w-0">
            <button
              type="button"
              onClick={handlePrev}
              disabled={isFirst}
              className={`shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-lg font-gaming transition-colors ${
                isFirst
                  ? 'text-(--text-muted)/50 cursor-not-allowed'
                  : 'text-(--text-muted) hover:text-(--accent-cyan) hover:bg-(--accent-cyan)/10 border border-(--border)'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              Wstecz
            </button>

            <div className="flex gap-1.5 shrink min-w-0 justify-center">
              {STEPS.map((_, i) => (
                <span
                  key={i}
                  className={`w-2 h-2 shrink-0 rounded-full transition-colors ${
                    i === step ? 'bg-(--accent-cyan)' : 'bg-(--border)'
                  }`}
                  aria-hidden
                />
              ))}
            </div>

            <button
              type="button"
              onClick={handleNext}
              className="shrink-0 flex items-center justify-center gap-1.5 min-w-29 px-5 py-2.5 rounded-lg bg-(--accent-cyan)/20 text-(--accent-cyan) border border-(--accent-cyan)/40 font-gaming hover:bg-(--accent-cyan)/30 transition-colors whitespace-nowrap"
            >
              {isLast ? 'Zakończ' : 'Dalej'}
              <ChevronRight className="w-4 h-4 shrink-0" />
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )

  return createPortal(modalContent, document.body)
}
