import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Lock, User, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import api from '../services/api'
import logoTRT from '../assets/TRT.jpeg'

export default function Login() {
  const { login }   = useAuth()
  const navigate    = useNavigate()

  const [form, setForm]             = useState({ login: '', mot_de_passe: '' })
  const [error, setError]           = useState('')
  const [loading, setLoading]       = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.login || !form.mot_de_passe) {
      setError('Veuillez remplir tous les champs.')
      return
    }
    setLoading(true)
    try {
      const { data } = await api.post('/auth/login', form)
      login(data)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || 'Login ou mot de passe incorrect.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">

      {/* ── Panneau gauche ─────────────────────────────────────────── */}
      <div className="hidden lg:flex w-3/5 bg-trt-900 relative overflow-hidden flex-col items-center justify-center">

        {/* Cercles décoratifs */}
        <div className="absolute top-[-80px] left-[-80px] w-72 h-72 rounded-full bg-white/[0.04]" />
        <div className="absolute bottom-[-60px] right-[-60px] w-96 h-96 rounded-full bg-white/[0.04]" />
        <div className="absolute top-1/2 right-16 -translate-y-1/2 w-48 h-48 rounded-full bg-white/[0.03]" />

        {/* Contenu centré */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 flex flex-col items-center text-center px-12 max-w-md"
        >
          {/* Logo */}
          <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center p-2 mb-7 shadow-lg">
            <img src={logoTRT} alt="Logo TRT" className="w-full h-full object-contain rounded-xl" />
          </div>

          {/* Nom de l'entreprise */}
          <h1 className="text-white text-2xl font-bold tracking-wide mb-1">
            Technologie Réseaux Télécom
          </h1>

          {/* Sous-titre avec ligne déco */}
          <p className="text-white/60 text-sm mb-3">Gestion des formations internes</p>
          <div className="w-10 h-0.5 bg-trt-300 rounded-full mb-6" />

          {/* Description */}
          <p className="text-white/40 text-sm leading-relaxed">
            Plateforme de gestion des sessions de formation,
            inscriptions, présences et évaluations des agents TRT.
          </p>
        </motion.div>

        {/* Copyright */}
        <p className="absolute bottom-6 text-white/20 text-xs">
          © {new Date().getFullYear()} TRT — Togo
        </p>
      </div>

      {/* ── Panneau droit — formulaire ──────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-8 bg-white">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="w-full max-w-sm"
        >
          {/* Logo mobile uniquement */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <img src={logoTRT} alt="Logo TRT"
              className="w-10 h-10 rounded-xl object-contain bg-gray-50 p-1 border border-gray-100" />
            <div>
              <p className="font-semibold text-gray-900 text-sm">TRT Formations</p>
              <p className="text-xs text-gray-400">Technologie Réseaux Télécom</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-1">Connexion</h2>
          <p className="text-sm text-gray-400 mb-7">Accès réservé aux responsables TRT</p>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 text-xs rounded-lg px-3 py-2.5 mb-5"
            >
              <AlertCircle size={13} className="flex-shrink-0" />
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Identifiant */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Identifiant
              </label>
              <div className="relative">
                <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" />
                <input
                  type="text" name="login" value={form.login}
                  onChange={handleChange} placeholder="Votre login"
                  className="w-full pl-10 pr-4 py-3 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-trt-500/20 focus:border-trt-500 focus:bg-white transition-all placeholder:text-gray-300"
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Mot de passe */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Mot de passe
              </label>
              <div className="relative">
                <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" />
                <input
                  type={showPassword ? 'text' : 'password'} name="mot_de_passe" value={form.mot_de_passe}
                  onChange={handleChange} placeholder="••••••••"
                  className="w-full pl-10 pr-11 py-3 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-trt-500/20 focus:border-trt-500 focus:bg-white transition-all placeholder:text-gray-300"
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Masquer' : 'Afficher'}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors p-0.5">
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Mot de passe oublié */}
            <div className="text-right -mt-1">
              <Link to="/mot-de-passe-oublie"
                className="text-xs text-trt-500 hover:text-trt-700 hover:underline transition-colors">
                Mot de passe oublié ?
              </Link>
            </div>

            {/* Bouton connexion */}
            <button
              type="submit" disabled={loading}
              className="w-full bg-trt-500 hover:bg-trt-700 active:scale-[0.98] text-white font-semibold text-sm py-3 rounded-lg transition-all disabled:opacity-60 mt-2 shadow-sm shadow-trt-500/30"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Connexion...
                </span>
              ) : 'Se connecter'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-6">
            Problème de connexion ?{' '}
            <a href="mailto:admin@trt.tg" className="text-trt-500 hover:text-trt-700 hover:underline transition-colors font-medium">
              Contactez l'administrateur
            </a>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
