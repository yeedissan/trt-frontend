import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Pagination({ meta, onPageChange }) {
  if (!meta || meta.last_page <= 1) return null

  const { current_page, last_page, from, to, total } = meta

  const pages = []
  for (let i = 1; i <= last_page; i++) {
    if (
      i === 1 ||
      i === last_page ||
      (i >= current_page - 1 && i <= current_page + 1)
    ) {
      pages.push(i)
    } else if (
      (i === current_page - 2 && current_page > 3) ||
      (i === current_page + 2 && current_page < last_page - 2)
    ) {
      pages.push('...')
    }
  }

  const uniquePages = pages.filter((p, i) => p !== '...' || pages[i - 1] !== '...')

  return (
    <div className="flex items-center justify-between mt-4">
      <p className="text-xs text-gray-400">
        {from}–{to} sur {total} résultat{total > 1 ? 's' : ''}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(current_page - 1)}
          disabled={current_page === 1}
          className="w-8 h-8 rounded-md flex items-center justify-center border border-gray-200 text-gray-400 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={13} />
        </button>

        {uniquePages.map((p, i) =>
          p === '...' ? (
            <span key={`dots-${i}`} className="w-8 h-8 flex items-center justify-center text-xs text-gray-300">
              ···
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`w-8 h-8 rounded-md text-xs font-medium transition-colors ${
                p === current_page
                  ? 'bg-trt-500 text-white'
                  : 'border border-gray-200 text-gray-500 hover:bg-gray-50'
              }`}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(current_page + 1)}
          disabled={current_page === last_page}
          className="w-8 h-8 rounded-md flex items-center justify-center border border-gray-200 text-gray-400 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight size={13} />
        </button>
      </div>
    </div>
  )
}
