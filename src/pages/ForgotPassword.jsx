import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react'
import api from '../services/api'
import logoTRT from '../assets/TRT.jpeg'

export default function ForgotPassword() {
  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError]     = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email) { setError('Veuillez saisir votre adresse email.'); return }
    setLoading(true)
    setError('')
    try {
      await api.post('/auth/forgot-password', { email })
      setSuccess(true)
    } catch {
      setError('Une erreur est survenue. Veuillez réessayer.')
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
            className="w-10 h-10 rounded-md object-contain bg-white p-1 border border-gray-100" />
          <div>
            <p className="font-medium text-gray-900 text-sm">TRT Formations</p>
            <p className="text-xs text-gray-400">Technologie Réseaux Télécom</p>
          </div>
        </div>

        <h2 className="text-2xl font-medium text-gray-900 mb-1">Mot de passe oublié</h2>
        <p className="text-sm text-gray-400 mb-8">
          Saisissez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
        </p>

        {success ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-4 bg-green-50 border border-green-200 rounded-lg px-6 py-8 text-center"
          >
            <CheckCircle2 size={40} className="text-green-500" />
            <div>
              <p className="text-sm font-medium text-green-800 mb-1">Email envoyé !</p>
              <p className="text-xs text-green-600 leading-relaxed">
                Si cette adresse existe dans notre système, un lien de réinitialisation vous a été envoyé. Vérifiez votre boite mail.
              </p>
            </div>
            <Link to="/login"
              className="text-xs text-trt-500 hover:underline flex items-center gap-1 mt-2">
              <ArrowLeft size={12} />
              Retour à la connexion
            </Link>
          </motion.div>
        ) : (
          <>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-xs rounded-md px-4 py-3 mb-5"
              >
                <AlertCircle size={14} className="flex-shrink-0" />
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Adresse email
                </label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
                  <input
                    type="email" value={email}
                    onChange={(e) => { setEmail(e.target.value); setError('') }}
                    placeholder="votre.email@trt.tg"
                    className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-trt-500 focus:border-trt-500 transition-all"
                    autoComplete="email"
                  />
                </div>
              </div>

              <button
                type="submit" disabled={loading}
                className="w-full bg-trt-500 hover:bg-trt-700 text-white font-medium text-sm py-2.5 rounded-md transition-colors disabled:opacity-60 mt-2"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    Envoi en cours...
                  </span>
                ) : 'Envoyer le lien'}
              </button>
            </form>

            <div className="text-center mt-6">
              <Link to="/login"
                className="text-xs text-gray-400 hover:text-gray-600 flex items-center justify-center gap-1 transition-colors">
                <ArrowLeft size={12} />
                Retour à la connexion
              </Link>
            </div>
          </>
        )}
      </motion.div>
    </div>
  )
}
