import { useState } from 'react'
import { motion } from 'framer-motion'
import { Menu, Bell, Sun, Moon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import Sidebar from './Sidebar'
import api from '../../services/api'
import { useAuth } from '../../hooks/useAuth'
import { useTheme } from '../../context/ThemeContext'

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -4 },
}

export default function Layout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { isDG, isSuperAdmin }      = useAuth()
  const { dark, toggle }            = useTheme()

  const isResponsable = !isDG() && !isSuperAdmin()

  const { data: notifData } = useQuery({
    queryKey: ['notifications'],
    queryFn:  () => api.get('/notifications').then((r) => r.data),
    enabled:  isResponsable,
    refetchInterval: 30_000,
    staleTime: 20_000,
  })

  const enAttente = notifData?.en_attente ?? 0

  return (
    <div className="flex min-h-screen bg-[#F8F9FA]">
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <div className="flex items-center justify-end px-6 pt-4 pb-0 gap-2 no-print">
          {/* Hamburger mobile */}
          <button
            className="lg:hidden mr-auto w-8 h-8 flex items-center justify-center rounded-md bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
            onClick={() => setMobileOpen(true)}
            aria-label="Ouvrir le menu"
          >
            <Menu size={15} />
          </button>

          {/* Toggle dark / light */}
          <button
            onClick={toggle}
            className="w-8 h-8 flex items-center justify-center rounded-md bg-white border border-gray-200 text-gray-400 hover:text-trt-500 hover:border-trt-500 transition-colors"
            aria-label={dark ? 'Mode clair' : 'Mode sombre'}
          >
            {dark ? <Sun size={14} /> : <Moon size={14} />}
          </button>

          {/* Cloche notifications — responsable uniquement */}
          {!isDG() && !isSuperAdmin() && (
            <Link to="/inscriptions?statut=en_attente" className="relative">
              <button
                className="w-8 h-8 flex items-center justify-center rounded-md bg-white border border-gray-200 text-gray-400 hover:text-trt-500 hover:border-trt-500 transition-colors"
                aria-label="Inscriptions en attente"
              >
                <Bell size={14} />
                {enAttente > 0 && (
                  <motion.span
                    key={enAttente}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center"
                  >
                    {enAttente > 99 ? '99+' : enAttente}
                  </motion.span>
                )}
              </button>
            </Link>
          )}
        </div>

        <motion.main
          className="flex-1 p-4 sm:p-6 overflow-auto"
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          {children}
        </motion.main>
      </div>
    </div>
  )
}
