import type { Store } from '../types/photoCard'

type StoreCardProps = {
  tienda: Store
  isFavorite?: boolean
  onFavoriteClick?: (storeId: number) => void
  onCardClick?: (storeId: number) => void
}

export default function StoreCard({ tienda, isFavorite = false, onFavoriteClick, onCardClick }: StoreCardProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onCardClick?.(tienda.id)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onCardClick?.(tienda.id)
        }
      }}
        className="group cursor-pointer overflow-hidden rounded-[28px] border border-blue-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-100/60"
    >
      <div className="relative h-44 overflow-hidden bg-gray-100">
        <img
          src={tienda.image}
          alt={tienda.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
      </div>

      <div className="p-6">
        <div className="mb-3 flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <h4 className="truncate text-xl font-bold tracking-tight text-gray-900">{tienda.name}</h4>
            <p className="mt-0.5 text-sm text-gray-500">Barbería y Estética</p>
          </div>

          <button
            onClick={(event) => {
              event.stopPropagation()
              onFavoriteClick?.(tienda.id)
            }}
            className={`ml-2 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-blue-600 bg-blue-600 text-xl text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-700 ${
              isFavorite ? 'shadow-blue-500/40' : 'opacity-95'
            }`}
          >
            {isFavorite ? '♥' : '♡'}
          </button>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-gray-50 pt-4">
          <div className="flex items-center gap-1.5">
            <span className="text-lg text-yellow-400">★</span>
            <span className="text-sm font-bold text-gray-900">{tienda.rating}</span>
            <span className="text-xs text-gray-400">({tienda.reviews} reseñas)</span>
          </div>
        </div>
      </div>
    </div>
  )
}