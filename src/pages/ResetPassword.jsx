import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Lock, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react'
import api from '../services/api'
import logoTRT from '../assets/TRT.jpeg'

export default function ResetPassword() {
  const [searchParams]                      = useSearchParams()
  const navigate                            = useNavigate()
  const [form, setForm]                     = useState({ mot_de_passe: '', confirmation: '' })
  const [showPassword, setShowPassword]     = useState(false)
  const [showConfirm, setShowConfirm]       = useState(false)
  const [loading, setLoading]               = useState(false)
  const [success, setSuccess]               = useState(false)
  const [error, setError]                   = useState('')

  const token = searchParams.get('token') ?? ''
  const email = searchParams.get('email') ?? ''

  useEffect(() => {
    if (!token || !email) navigate('/mot-de-passe-oublie', { replace: true })
  }, [token, email, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.mot_de_passe || !form.confirmation) {
      setError('Veuillez remplir tous les champs.')
      return
    }
    if (form.mot_de_passe.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }
    if (form.mot_de_passe !== form.confirmation) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }

    setLoading(true)
    setError('')
    try {
      await api.post('/auth/reset-password', {
        email,
        token,
        mot_de_passe: form.mot_de_passe,
      })
      setSuccess(true)
      setTimeout(() => navigate('/login'), 3000)
    } catch (err) {
      setError(err.response?.data?.message || 'Lien invalide ou expiré.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <img src={logoTRT} alt="Logo TRT"
            className="w-12 h-12 rounded-xl object-contain bg-white p-1 border border-gray-100" />
          <div>
            <p className="font-medium text-gray-900 text-sm">TRT Formations</p>
            <p className="text-xs text-gray-400">Technologie Réseaux Télécom</p>
          </div>
        </div>

        <h2 className="text-2xl font-medium text-gray-900 mb-1">Nouveau mot de passe</h2>
        <p className="text-sm text-gray-400 mb-8">
          Choisissez un nouveau mot de passe pour votre compte.
        </p>

        {success ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-4 bg-green-50 border border-green-200 rounded-2xl px-6 py-8 text-center"
          >
            <CheckCircle2 size={40} className="text-green-500" />
            <div>
              <p className="text-sm font-medium text-green-800 mb-1">Mot de passe modifié !</p>
              <p className="text-xs text-green-600 leading-relaxed">
                Votre mot de passe a été réinitialisé avec succès. Vous allez être redirigé vers la page de connexion...
              </p>
            </div>
            <Link to="/login" className="text-xs text-trt-500 hover:underline mt-1">
              Se connecter maintenant
            </Link>
          </motion.div>
        ) : (
          <>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl px-4 py-3 mb-5"
              >
                <AlertCircle size={14} className="flex-shrink-0" />
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Nouveau mot de passe
                </label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.mot_de_passe}
                    onChange={(e) => { setForm({ ...form, mot_de_passe: e.target.value }); setError('') }}
                    placeholder="Minimum 8 caractères"
                    className="w-full pl-9 pr-10 py-3 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-trt-500 focus:border-transparent transition-all"
                  />
                  <button type="button" onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors">
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Confirmer le mot de passe
                </label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={form.confirmation}
                    onChange={(e) => { setForm({ ...form, confirmation: e.target.value }); setError('') }}
                    placeholder="Répétez le mot de passe"
                    className="w-full pl-9 pr-10 py-3 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-trt-500 focus:border-transparent transition-all"
                  />
                  <button type="button" onClick={() => setShowConfirm(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors">
                    {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <motion.button
                type="submit" disabled={loading}
                whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                className="w-full bg-trt-500 hover:bg-trt-700 text-white font-medium text-sm py-3 rounded-xl transition-colors disabled:opacity-60 mt-2"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    Modification...
                  </span>
                ) : 'Réinitialiser le mot de passe'}
              </motion.button>
            </form>
          </>
        )}
      </motion.div>
    </div>
  )
}
