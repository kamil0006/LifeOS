import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { authApi } from '../lib/api'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

export function Login() {
  const [isRegister, setIsRegister] = useState(false)
  const [showReset, setShowReset] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const { login, register, enterDemoMode } = useAuth()
  const navigate = useNavigate()
  const mounted = useRef(true)
  useEffect(() => () => { mounted.current = false }, [])

  const handleDemo = () => {
    enterDemoMode()
    navigate('/dashboard')
  }

  function getErrorMessage(err: unknown): string {
    if (err instanceof Error) {
      const m = err.message.toLowerCase()
      if (m.includes('failed to fetch') || m.includes('econnrefused') || m.includes('networkerror')) {
        return 'Nie można połączyć z serwerem. Upewnij się, że backend działa (port 3002).'
      }
      return err.message
    }
    return 'Wystąpił nieoczekiwany błąd'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (isRegister && password !== passwordConfirm) {
      setError('Hasła muszą być identyczne')
      return
    }
    setLoading(true)
    const start = Date.now()
    const minLoadingMs = 400
    try {
      if (showReset) {
        await authApi.resetPassword(email.trim().toLowerCase(), newPassword)
        setSuccess('Hasło zaktualizowane. Możesz się zalogować.')
        setShowReset(false)
        setNewPassword('')
      } else if (isRegister) {
        await register(email, password, rememberMe)
        navigate('/dashboard')
      } else {
        await login(email, password, rememberMe)
        navigate('/dashboard')
      }
    } catch (err) {
      setError(getErrorMessage(err))
      setLoading(false)
      return
    }
    const elapsed = Date.now() - start
    const remaining = Math.max(0, minLoadingMs - elapsed)
    if (remaining > 0) {
      setTimeout(() => { if (mounted.current) setLoading(false) }, remaining)
    } else {
      setLoading(false)
    }
  }

  const listItems = [
    'Śledź wydatki i przychody',
    'Buduj nawyki i osiągaj cele',
    'Kalendarz, notatki i nauka',
  ]

  return (
    <div className="min-h-screen flex items-center justify-center bg-(--bg-dark) bg-grid p-6">
      <div className="w-full max-w-4xl flex flex-col lg:flex-row gap-12 lg:gap-16 items-center">
        {/* Lewa kolumna – branding + demo */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center lg:items-start text-center lg:text-left flex-1"
        >
          <motion.h1
            className="text-5xl xl:text-6xl font-bold font-gaming tracking-widest"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <motion.span
              className="text-(--accent-cyan) drop-shadow-[0_0_12px_rgba(0,229,255,0.6)]"
              animate={{ opacity: [0.9, 1, 0.9] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              Life
            </motion.span>
            <span className="text-(--text-primary)">OS</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-xl text-(--text-muted) mt-4 font-gaming tracking-wide max-w-md"
          >
            Finanse, nawyki, cele i notatki w jednym miejscu. Zarządzaj życiem świadomie.
          </motion.p>
          <ul className="mt-8 space-y-3 text-base text-(--text-muted)">
            {listItems.map((text, i) => (
              <motion.li
                key={text}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1, duration: 0.4 }}
                className="flex items-center gap-2 justify-center lg:justify-start"
              >
                <motion.span
                  className="w-1.5 h-1.5 rounded-full bg-(--accent-cyan) shrink-0"
                  animate={{ opacity: [0.6, 1, 0.6], scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                />
                {text}
              </motion.li>
            ))}
          </ul>
          <motion.button
            type="button"
            onClick={handleDemo}
            className="mt-10 w-full max-w-xs py-3 rounded-lg bg-(--accent-cyan)/20 text-(--accent-cyan) border border-(--accent-cyan)/50 font-gaming tracking-wider hover:bg-(--accent-cyan)/30 hover:shadow-[0_0_20px_rgba(0,229,255,0.25)] transition-colors"
            whileHover={{ scale: 1.02, boxShadow: '0 0 24px rgba(0,229,255,0.3)' }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.4, delay: 0.25 }}
          >
            Wypróbuj demo
          </motion.button>
        </motion.div>

        {/* Prawa kolumna – formularz */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md shrink-0"
        >
          <motion.div
            className="rounded-lg border border-(--border) bg-(--bg-card) p-6 relative overflow-hidden shadow-[0_0_30px_rgba(0,229,255,0.05)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
          >
            <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-(--accent-cyan)/50 to-transparent" />
            <p className="text-base text-(--text-muted) mb-4 font-gaming tracking-wide">
              {isRegister ? 'Załóż konto' : 'Zaloguj się, aby zarządzać danymi'}
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="p-3 rounded-lg bg-red-500/10 text-red-400 text-sm"
                  >
                    {error}
                  </motion.div>
                )}
                {success && (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="p-3 rounded-lg bg-green-500/10 text-green-400 text-sm"
                  >
                    {success}
                  </motion.div>
                )}
              </AnimatePresence>
              <div>
                <label className="block text-base text-(--text-muted) mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setError('')
                  }}
                  required
                  className="w-full px-4 py-2.5 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) text-base focus:border-(--accent-cyan) focus:outline-none"
                />
              </div>
              {showReset ? (
                <div>
                  <label className="block text-base text-(--text-muted) mb-1">Nowe hasło</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full px-4 py-2.5 pr-11 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) text-base focus:border-(--accent-cyan) focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-(--text-muted) hover:text-(--accent-cyan) transition-colors"
                      tabIndex={-1}
                      aria-label={showNewPassword ? 'Ukryj hasło' : 'Pokaż hasło'}
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-sm text-(--text-muted) mt-1">Minimum 6 znaków</p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-base text-(--text-muted) mb-1">Hasło</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value)
                          setError('')
                        }}
                        required
                        minLength={isRegister ? 6 : 1}
                        className="w-full px-4 py-2.5 pr-11 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) text-base focus:border-(--accent-cyan) focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-(--text-muted) hover:text-(--accent-cyan) transition-colors"
                        tabIndex={-1}
                        aria-label={showPassword ? 'Ukryj hasło' : 'Pokaż hasło'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {isRegister && (
                      <p className="text-sm text-(--text-muted) mt-1">Minimum 6 znaków</p>
                    )}
                  </div>
                  {isRegister && (
                    <div>
                      <label className="block text-base text-(--text-muted) mb-1">Potwierdź hasło</label>
                      <div className="relative">
                        <input
                          type={showPasswordConfirm ? 'text' : 'password'}
                          value={passwordConfirm}
                          onChange={(e) => {
                            setPasswordConfirm(e.target.value)
                            setError('')
                          }}
                          required
                          minLength={6}
                          className="w-full px-4 py-2.5 pr-11 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) text-base focus:border-(--accent-cyan) focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-(--text-muted) hover:text-(--accent-cyan) transition-colors"
                          tabIndex={-1}
                          aria-label={showPasswordConfirm ? 'Ukryj hasło' : 'Pokaż hasło'}
                        >
                          {showPasswordConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
              {!showReset && (
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-(--border) bg-(--bg-dark) text-(--accent-cyan) focus:ring-(--accent-cyan)/50"
                  />
                  <span className="text-sm text-(--text-muted)">Zapamiętaj mnie</span>
                </label>
              )}
              <motion.button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-lg bg-(--accent-cyan)/15 text-(--accent-cyan) border border-(--accent-cyan)/40 font-gaming tracking-wider hover:bg-(--accent-cyan)/25 hover:shadow-[0_0_20px_rgba(0,229,255,0.2)] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                whileHover={!loading ? { scale: 1.01 } : undefined}
                whileTap={!loading ? { scale: 0.99 } : undefined}
                transition={{ duration: 0.4, delay: 0.25 }}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin shrink-0" />
                    <span>
                      {showReset ? 'Resetowanie...' : isRegister ? 'Rejestracja...' : 'Logowanie...'}
                    </span>
                  </>
                ) : (
                  showReset ? 'Zresetuj hasło' : isRegister ? 'Zarejestruj' : 'Zaloguj'
                )}
              </motion.button>
            </form>
            {showReset ? (
              <button
                type="button"
                onClick={() => {
                  setShowReset(false)
                  setShowNewPassword(false)
                  setError('')
                  setSuccess('')
                }}
                className="w-full mt-4 text-sm text-(--text-muted) hover:text-(--accent-cyan) transition-colors"
              >
                ← Wróć do logowania
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setIsRegister(!isRegister)
                    setError('')
                    setPasswordConfirm('')
                    setShowPassword(false)
                    setShowPasswordConfirm(false)
                  }}
                  className="w-full mt-4 text-sm text-(--text-muted) hover:text-(--accent-cyan) transition-colors"
                >
                  {isRegister ? 'Mam konto – zaloguj się' : 'Nie mam konta – zarejestruj się'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowReset(true)
                    setError('')
                    setSuccess('')
                  }}
                  className="w-full mt-2 text-sm text-(--text-muted) hover:text-(--accent-cyan) transition-colors"
                >
                  Nie mogę się zalogować – zresetuj hasło
                </button>
              </>
            )}
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
