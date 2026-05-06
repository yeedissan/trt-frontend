import { Printer } from 'lucide-react'

export default function PrintButton({ label = 'Imprimer' }) {
  return (
    <button
      onClick={() => window.print()}
      className="no-print flex items-center gap-1.5 border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700 hover:border-gray-300 text-xs font-medium px-3 py-2 rounded-md transition-colors"
      aria-label="Imprimer la page"
    >
      <Printer size={12} />
      {label}
    </button>
  )
}
