import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Home, AlertTriangle } from 'lucide-react'

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center max-w-sm"
      >
        <div className="w-20 h-20 rounded-2xl bg-trt-100 flex items-center justify-center mx-auto mb-6">
          <AlertTriangle size={36} className="text-trt-500" />
        </div>

        <h1 className="text-6xl font-medium text-gray-900 mb-2">404</h1>
        <p className="text-base font-medium text-gray-600 mb-2">Page introuvable</p>
        <p className="text-sm text-gray-400 mb-8">
          La page que vous recherchez n'existe pas ou a été déplacée.
        </p>

        <motion.button
          onClick={() => navigate('/')}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className="inline-flex items-center gap-2 bg-trt-500 hover:bg-trt-700 text-white text-sm font-medium px-6 py-3 rounded-xl transition-colors"
        >
          <Home size={15} />
          Retour au tableau de bord
        </motion.button>
      </motion.div>
    </div>
  )
}
