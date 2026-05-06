// src/components/ui/Skeleton.jsx

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-lg border border-gray-100 p-5 animate-pulse">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-11 h-11 rounded-lg bg-gray-100 flex-shrink-0" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-3 bg-gray-100 rounded w-3/4" />
          <div className="h-2.5 bg-gray-100 rounded w-1/2" />
        </div>
      </div>
      <div className="space-y-2 border-t border-gray-50 pt-3">
        <div className="h-2.5 bg-gray-100 rounded w-full" />
        <div className="h-2.5 bg-gray-100 rounded w-2/3" />
      </div>
    </div>
  )
}

export function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      <td className="px-4 py-3"><div className="h-3 bg-gray-100 rounded w-3/4" /></td>
      <td className="px-4 py-3"><div className="h-3 bg-gray-100 rounded w-2/3" /></td>
      <td className="px-4 py-3"><div className="h-3 bg-gray-100 rounded w-1/2" /></td>
      <td className="px-4 py-3"><div className="h-3 bg-gray-100 rounded w-1/3" /></td>
      <td className="px-4 py-3"><div className="h-5 bg-gray-100 rounded w-16" /></td>
      <td className="px-4 py-3"><div className="h-5 bg-gray-100 rounded w-20" /></td>
    </tr>
  )
}

export function SkeletonGrid({ count = 6 }) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}

export function SkeletonTable({ rows = 5 }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <table className="w-full" style={{ tableLayout: 'fixed' }}>
        <thead>
          <tr className="bg-trt-500">
            {Array.from({ length: 6 }).map((_, i) => (
              <th key={i} className="px-4 py-3">
                <div className="h-2.5 bg-white/20 rounded w-3/4 animate-pulse" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {Array.from({ length: rows }).map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function SkeletonCards({ count = 6 }) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-lg border border-gray-100 p-5 animate-pulse">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-11 h-11 rounded-lg bg-gray-100 flex-shrink-0" />
            <div className="flex-1 space-y-2 pt-1">
              <div className="h-3 bg-gray-100 rounded w-3/4" />
              <div className="h-2.5 bg-gray-100 rounded w-1/2" />
            </div>
          </div>
          <div className="space-y-2 border-t border-gray-50 pt-3">
            <div className="h-2.5 bg-gray-100 rounded w-full" />
            <div className="h-2.5 bg-gray-100 rounded w-2/3" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function PageLoader() {
  return (
    <div className="flex flex-col items-center justify-center py-32">
      <div className="flex gap-1.5">
        <div className="w-2 h-2 rounded-full bg-trt-500 animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 rounded-full bg-trt-500 animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 rounded-full bg-trt-500 animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <p className="text-xs text-gray-400 mt-3">Chargement...</p>
    </div>
  )
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      {Icon && (
        <div className="w-12 h-12 rounded-lg bg-gray-50 flex items-center justify-center mb-4">
          <Icon size={22} className="text-gray-300" />
        </div>
      )}
      <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
      {description && (
        <p className="text-xs text-gray-400 mb-5 max-w-xs">{description}</p>
      )}
      {actionLabel && onAction && (
        <button onClick={onAction}
          className="text-xs bg-trt-500 hover:bg-trt-700 text-white font-medium px-4 py-2 rounded-md transition-colors">
          {actionLabel}
        </button>
      )}
    </div>
  )
}
