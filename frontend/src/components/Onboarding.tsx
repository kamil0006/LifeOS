import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useOnboardingMotion } from '../lib/modalMotion'
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
    desc: 'Nawyki, cele, nauka (kursy, książki, projekty) – śledź swój postęp.',
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
  const { overlay, stepCard } = useOnboardingMotion()
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

  const current = STEPS[step]
  const Icon = current.icon
  const isFirst = step === 0
  const isLast = step === STEPS.length - 1

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="onboarding-shell"
          {...overlay}
          className="fixed inset-0 z-9998 flex items-start justify-center px-4 pt-[max(2rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6 lg:items-start lg:justify-start lg:pl-68 lg:pr-6 lg:pt-10"
          onClick={handleDismiss}
        >
          <motion.div
            key={step}
            {...stepCard}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg rounded-xl border border-(--border) bg-(--bg-card) p-5 shadow-xl sm:p-6 lg:max-w-md"
          >
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-(--text-muted) hover:text-(--text-primary) hover:bg-(--bg-dark) transition-colors"
            aria-label="Zamknij"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col items-center text-center pt-2">
            <div className="mb-4 grid size-14 place-items-center rounded-xl border border-(--accent-cyan)/40 bg-(--accent-cyan)/15">
              <Icon className="size-7 shrink-0 text-(--accent-cyan) [stroke-linecap:round] [stroke-linejoin:round]" aria-hidden />
            </div>
            <h2 className="text-xl font-bold text-(--text-primary) font-gaming tracking-wider">
              {current.title}
            </h2>
            <p className="text-base text-(--text-muted) mt-3 leading-relaxed">
              {current.desc}
            </p>
          </div>

          <div className="mt-8 grid grid-cols-2 grid-rows-[auto_auto] gap-x-2 gap-y-3 sm:grid-cols-[1fr_auto_1fr] sm:grid-rows-1 sm:items-center sm:gap-x-3">
            <div className="col-start-1 row-start-1 flex min-w-0 justify-start self-center">
              <button
                type="button"
                onClick={handlePrev}
                disabled={isFirst}
                className={`flex min-w-0 max-w-full items-center gap-1 rounded-lg px-3 py-2.5 text-sm font-gaming transition-colors sm:gap-1.5 sm:px-4 sm:text-base ${
                  isFirst
                    ? 'cursor-not-allowed text-(--text-muted)/50'
                    : 'border border-(--border) text-(--text-muted) hover:bg-(--accent-cyan)/10 hover:text-(--accent-cyan)'
                }`}
              >
                <ChevronLeft className="h-4 w-4 shrink-0" />
                <span className="truncate">Wstecz</span>
              </button>
            </div>

            <div className="col-start-2 row-start-1 flex min-w-0 justify-end self-center sm:col-start-3">
              <button
                type="button"
                onClick={handleNext}
                className="flex min-w-0 max-w-full items-center justify-center gap-1 rounded-lg border border-(--accent-cyan)/40 bg-(--accent-cyan)/20 px-3 py-2.5 text-sm font-gaming text-(--accent-cyan) transition-colors hover:bg-(--accent-cyan)/30 sm:gap-1.5 sm:px-5 sm:text-base"
              >
                <span className="truncate">{isLast ? 'Zakończ' : 'Dalej'}</span>
                <ChevronRight className="h-4 w-4 shrink-0" />
              </button>
            </div>

            <div className="col-span-2 row-start-2 flex flex-wrap justify-center gap-1.5 sm:col-span-1 sm:col-start-2 sm:row-start-1 sm:max-w-none">
              {STEPS.map((_, i) => (
                <span
                  key={i}
                  className={`h-2 w-2 shrink-0 rounded-full transition-colors ${
                    i === step ? 'bg-(--accent-cyan)' : 'bg-(--border)'
                  }`}
                  aria-hidden
                />
              ))}
            </div>
          </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  return createPortal(modalContent, document.body)
}
