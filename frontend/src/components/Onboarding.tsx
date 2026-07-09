import { useState, useEffect, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
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

const STEP_ICONS_AND_PATHS = [
  { icon: Sparkles, path: '/dashboard' },
  { icon: LayoutDashboard, path: '/dashboard' },
  { icon: Wallet, path: '/finances' },
  { icon: CalendarIcon, path: '/calendar' },
  { icon: Target, path: '/habits' },
  { icon: CheckSquare, path: '/dashboard' },
]

export function Onboarding() {
  const { t } = useTranslation('onboarding')
  const { isOpen, close } = useOnboarding()
  const { overlay, stepCard } = useOnboardingMotion()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)

  const stepsText = t('steps', { returnObjects: true }) as { title: string; desc: string }[]
  const STEPS = useMemo(
    () =>
      STEP_ICONS_AND_PATHS.map(({ icon, path }, i) => ({
        icon,
        path,
        title: stepsText[i].title,
        desc: stepsText[i].desc,
      })),
    [stepsText]
  )

  useEffect(() => {
    if (isOpen) setStep(0)
  }, [isOpen])

  useEffect(() => {
    // Navigate off STEP_ICONS_AND_PATHS (a stable module-level constant), not the
    // translated STEPS — t()'s returned array isn't guaranteed referentially
    // stable across renders, and depending on it here caused a navigate/render loop.
    const path = STEP_ICONS_AND_PATHS[step]?.path
    if (isOpen && path) {
      navigate(path)
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
            aria-label={t('closeAria')}
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col items-center text-center pt-2">
            <div className="mb-4 grid size-14 place-items-center rounded-xl border border-(--accent)/40 bg-(--accent)/15">
              <Icon className="size-7 shrink-0 text-(--accent) [stroke-linecap:round] [stroke-linejoin:round]" aria-hidden />
            </div>
            <h2 className="text-xl font-bold text-(--text-primary) font-display tracking-wider">
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
                className={`flex min-w-0 max-w-full items-center gap-1 rounded-lg px-3 py-2.5 text-sm font-display transition-colors sm:gap-1.5 sm:px-4 sm:text-base ${
                  isFirst
                    ? 'cursor-not-allowed text-(--text-muted)/50'
                    : 'border border-(--border) text-(--text-muted) hover:bg-(--accent)/10 hover:text-(--accent)'
                }`}
              >
                <ChevronLeft className="h-4 w-4 shrink-0" />
                <span className="truncate">{t('back')}</span>
              </button>
            </div>

            <div className="col-start-2 row-start-1 flex min-w-0 justify-end self-center sm:col-start-3">
              <button
                type="button"
                onClick={handleNext}
                className="flex min-w-0 max-w-full items-center justify-center gap-1 rounded-lg border border-(--accent)/40 bg-(--accent)/20 px-3 py-2.5 text-sm font-display text-(--accent) transition-colors hover:bg-(--accent)/30 sm:gap-1.5 sm:px-5 sm:text-base"
              >
                <span className="truncate">{isLast ? t('finish') : t('next')}</span>
                <ChevronRight className="h-4 w-4 shrink-0" />
              </button>
            </div>

            <div className="col-span-2 row-start-2 flex flex-wrap justify-center gap-1.5 sm:col-span-1 sm:col-start-2 sm:row-start-1 sm:max-w-none">
              {STEPS.map((_, i) => (
                <span
                  key={i}
                  className={`h-2 w-2 shrink-0 rounded-full transition-colors ${
                    i === step ? 'bg-(--accent)' : 'bg-(--border)'
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
