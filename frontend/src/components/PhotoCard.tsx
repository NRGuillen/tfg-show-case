import { useState } from 'react'
import type { PhotoCard as PhotoCardType } from '../types/photoCard'

type PhotoCardProps = {
  foto: PhotoCardType
  onClick?: (foto: PhotoCardType) => void
}

export default function PhotoCard({ foto, onClick }: PhotoCardProps) {
  const [siguiendo, setSiguiendo] = useState(false)

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onClick?.(foto)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onClick?.(foto)
        }
      }}
      className="flex w-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white text-left shadow-sm transition hover:shadow-md"
    >
      <div className="flex items-center justify-between border-b border-gray-100 p-3">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="h-8 w-8 shrink-0 rounded-full border border-gray-300 bg-gray-200" />
          <div className="min-w-0 flex-col">
            <span className="block truncate text-[13px] font-bold text-gray-900">{foto.salon}</span>
            <span className="block truncate text-[11px] text-gray-400">⭐ {foto.rating} ({foto.reviews} reseñas)</span>
          </div>
        </div>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            setSiguiendo(!siguiendo)
          }}
          className="shrink-0 rounded-lg border border-black px-4 py-1 text-[11px] font-bold transition-all hover:bg-black hover:text-white"
        >
          {siguiendo ? 'Siguiendo' : 'Seguir'}
        </button>
      </div>

      <div className="aspect-[4/3] overflow-hidden bg-[#EBEBEB]">
        {foto.image ? (
          <img src={foto.image} className="h-full w-full object-cover" alt={foto.salon} />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="text-6xl font-thin text-gray-300">?</span>
          </div>
        )}
      </div>
    </div>
  )
}