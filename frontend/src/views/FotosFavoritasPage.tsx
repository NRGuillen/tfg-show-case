import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/HeaderUsuario'
import FooterUsuario from '../components/FooterUsuario'
import { useAuthContext } from '../hooks/useAuthContext'
import type { FotoFavoritaUsuario } from '../types/photoCard'

export default function FotosFavoritasPage() {
  const { token } = useAuthContext()
  const navigate = useNavigate()
  const [fotos, setFotos] = useState<FotoFavoritaUsuario[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

    const cargarFotosFavoritas = async () => {
      if (!token) {
        setFotos([])
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`${apiUrl}/api/fotos/fotos-favoritas`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })

        const result = await response.json()

        if (response.ok && result.ok && Array.isArray(result.fotos)) {
          setFotos(result.fotos as FotoFavoritaUsuario[])
        } else {
          setFotos([])
        }
      } catch (error) {
        console.error('Error cargando fotos favoritas:', error)
        setFotos([])
      } finally {
        setLoading(false)
      }
    }

    void cargarFotosFavoritas()
  }, [token])

  return (
    <div className="min-h-screen bg-white text-[#111111]">
      <Header />

      <main className="mx-auto w-full px-6 py-8 pb-32 md:px-10">
        <h1 className="mb-6 text-3xl font-extrabold text-[#31435C]">Fotos favoritas</h1>

        {loading ? (
          <p className="text-lg font-semibold">Cargando fotos favoritas...</p>
        ) : fotos.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-xl italic text-gray-400">Todavía no tienes fotos favoritas guardadas.</p>
          </div>
        ) : (
          <section className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {fotos.map((foto) => (
              <article
                key={foto.id_favorita}
                className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
              >
                <header className="border-b border-gray-100 p-3">
                  <p
                    role="button"
                    tabIndex={0}
                    onClick={() => navigate(`/peluqueria/${foto.id_peluqueria}`)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        navigate(`/peluqueria/${foto.id_peluqueria}`)
                      }
                    }}
                    className="w-fit cursor-pointer text-sm font-bold text-[#31435C]"
                  >
                    {foto.nombre_empresa}
                  </p>
                  <p className="text-sm text-gray-700">{foto.nombre_personal}</p>
                </header>
                <img src={foto.url} alt="Foto favorita" className="w-full object-cover" />
              </article>
            ))}
          </section>
        )}
      </main>

      <FooterUsuario />
    </div>
  )
}