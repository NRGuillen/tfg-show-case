import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import StoreCard from '../components/StoreCard'
import type { PhotoCard, Store } from '../types/photoCard'
import { useAuthContext } from '../hooks/useAuthContext'

export default function HomePage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [data, setData] = useState<Store[]>([])
  const [filtroActivo, setFiltroActivo] = useState<string>('Reseñas')
  const [favoriteStoreIds, setFavoriteStoreIds] = useState<number[]>([])
  const { token, usuario } = useAuthContext()
  const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

  useEffect(() => {

    const cargarTiendas = async () => {
      try {
        const [storesResponse, favoritosResponse] = await Promise.all([
          fetch(`${apiUrl}/api/fotos`),
          token
            ? fetch(`${apiUrl}/api/fotos/favoritos`, {
                headers: { Authorization: `Bearer ${token}` }
              })
            : Promise.resolve(null)
        ])

        const result = await storesResponse.json()

        if (!storesResponse.ok || !Array.isArray(result)) {
          console.error('Respuesta no válida al cargar tiendas:', result)
          setData([])
          return
        }

        if (favoritosResponse) {
          const favoritosResult = await favoritosResponse.json()
          if (favoritosResponse.ok && favoritosResult.ok && Array.isArray(favoritosResult.favoritos)) {
            setFavoriteStoreIds(favoritosResult.favoritos.map((id: number) => Number(id)))
          }
        } else {
          setFavoriteStoreIds([])
        }

        const stores = (result as PhotoCard[]).map((store) => ({
          id: store.id,
          name: store.salon,
          rating: store.rating,
          reviews: store.reviews,
          image: store.image
        }))

        const searchParams = new URLSearchParams(location.search)
        const busqueda = (searchParams.get('q') ?? '').trim().toLowerCase()

        if (!busqueda) {
          setData(stores)
          return
        }

        const tiendasFiltradas = stores.filter((tienda) => tienda.name.toLowerCase().startsWith(busqueda))
        setData(tiendasFiltradas)
      } catch (error) {
        console.error('Error cargando tiendas:', error)
        setData([])
      }
    }

    void cargarTiendas()
  }, [location.search, token])

  const filtros = ['Reseñas', 'Favoritos']

  const handleFavoriteClick = async (idPeluqueria: number) => {
    if (!token || !usuario?.id_usuario) {
      alert('Debes iniciar sesión para guardar favoritos')
      return
    }

    const isFavorite = favoriteStoreIds.includes(idPeluqueria)
    try {
      const response = await fetch(`${apiUrl}/api/fotos/${idPeluqueria}/favorito`, {
        method: isFavorite ? 'DELETE' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        alert(errorData.message ?? 'No se pudo guardar en favoritos')
        return
      }

      setFavoriteStoreIds((prev) =>
        isFavorite ? prev.filter((storeId) => storeId !== idPeluqueria) : [...prev, idPeluqueria]
      )
    } catch (error) {
      console.error('Error guardando favorito:', error)
      alert('Error al guardar favorito')
    }
  }

  const storesToRender =
    filtroActivo === 'Favoritos'
      ? data.filter((store) => favoriteStoreIds.includes(store.id))
      : filtroActivo === 'Reseñas'
        ? [...data].sort((a, b) => b.rating - a.rating)
        : data

  return (
    <main className="w-full pb-32">
      <section className="mb-8 w-full border-y border-gray-100 bg-white p-4 shadow-xl shadow-gray-100/70 md:p-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">Explorar peluquerías</p>
            <h2 className="text-3xl font-black tracking-tight text-gray-900">{storesToRender.length} resultados</h2>
          </div>
          <p className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
            Filtro activo: {filtroActivo}
          </p>
        </div>

        <div className="flex flex-wrap justify-start gap-3">
          {filtros.map((filtro) => (
            <button
              key={filtro}
              onClick={() => setFiltroActivo(filtro)}
              className={`rounded-2xl border px-6 py-3 text-sm font-bold uppercase tracking-wide transition-all ${
                filtroActivo === filtro
                  ? 'border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-200'
                  : 'border-gray-200 bg-gray-50 text-gray-500 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700'
              }`}
            >
              {filtro}
            </button>
          ))}
        </div>
      </section>

      <div className="grid w-full grid-cols-1 gap-8 px-4 md:grid-cols-2 md:px-6 lg:grid-cols-3">
        {storesToRender.map((tienda) => (
          <StoreCard
            key={tienda.id}
            tienda={tienda}
            isFavorite={favoriteStoreIds.includes(tienda.id)}
            onFavoriteClick={handleFavoriteClick}
            onCardClick={(storeId) => navigate(`/peluqueria/${storeId}`)}
          />
        ))}
      </div>
    </main>
  )
}