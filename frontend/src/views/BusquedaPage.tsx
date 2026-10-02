import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/HeaderUsuario'
import FooterUsuario from '../components/FooterUsuario'
import { useAuthContext } from '../hooks/useAuthContext'

type PublicacionBusqueda = {
  id_publicacion: number
  id_peluqueria: number
  id_personal: number
  imagen_url: string
  nombre_empresa: string
  nombre_trabajador: string
}

export default function BusquedaPage() {
  const [data, setData] = useState<PublicacionBusqueda[]>([])
  const [fotosGuardadas, setFotosGuardadas] = useState<number[]>([])
  const navigate = useNavigate()
  const { token } = useAuthContext()

  const fotosGuardadasSet = useMemo(() => new Set(fotosGuardadas), [fotosGuardadas])

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

    const cargarFotos = async () => {
      try {
        const response = await fetch(`${apiUrl}/api/fotos/publicaciones`)
        const result = await response.json()

        if (response.ok && result.ok && Array.isArray(result.publicaciones)) {
          const publicaciones = result.publicaciones as PublicacionBusqueda[]
          setData(publicaciones)

          if (!token) {
            setFotosGuardadas([])
            return
          }

          const favoritasResponse = await fetch(`${apiUrl}/api/fotos/fotos-favoritas`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          })
          const favoritasResult = await favoritasResponse.json()

          if (favoritasResponse.ok && favoritasResult.ok && Array.isArray(favoritasResult.fotos)) {
            const favoritasGuardadas = favoritasResult.fotos as Array<{
              id_peluqueria: number
              id_personal: number
              url: string
            }>

            const publicacionesGuardadas = publicaciones
              .filter((publicacion) =>
                favoritasGuardadas.some(
                  (foto) =>
                    foto.id_peluqueria === publicacion.id_peluqueria &&
                    foto.id_personal === publicacion.id_personal &&
                    foto.url === publicacion.imagen_url
                )
              )
              .map((publicacion) => publicacion.id_publicacion)

            setFotosGuardadas(publicacionesGuardadas)
          } else {
            setFotosGuardadas([])
          }
        } else {
          console.error('Respuesta no válida al cargar publicaciones:', result)
          setData([])
          setFotosGuardadas([])
        }
      } catch (error) {
        console.error('Error cargando publicaciones:', error)
        setData([])
        setFotosGuardadas([])
      }
    }

    void cargarFotos()
  }, [token])

  const manejarGuardarFoto = async (foto: PublicacionBusqueda) => {
    if (!token) {
      alert('Debes iniciar sesión para guardar fotos favoritas')
      return
    }

    const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'
    const yaGuardada = fotosGuardadasSet.has(foto.id_publicacion)

    try {
      const response = await fetch(`${apiUrl}/api/fotos/fotos-favoritas`, {
        method: yaGuardada ? 'DELETE' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          url: foto.imagen_url,
          id_personal: foto.id_personal,
          id_peluqueria: foto.id_peluqueria
        })
      })

      const result = await response.json()

      if (!response.ok || !result.ok) {
        alert(result.message ?? 'No se pudo actualizar la foto')
        return
      }

      setFotosGuardadas((prev) =>
        yaGuardada
          ? prev.filter((idPublicacion) => idPublicacion !== foto.id_publicacion)
          : [...prev, foto.id_publicacion]
      )
    } catch (error) {
      console.error('Error guardando foto favorita:', error)
      alert('Error al actualizar la foto favorita')
    }
  }

  return (
    <div className="min-h-screen bg-white text-[#111111]">
      <Header />
      <main className="mx-auto w-full px-6 py-8 pb-32 md:px-10">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {data.map((foto) => (
            <article
              key={foto.id_publicacion}
              className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md"
            >
              <header className="flex items-center justify-between border-b border-gray-100 p-3">
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/peluqueria/${foto.id_peluqueria}`)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      navigate(`/peluqueria/${foto.id_peluqueria}`)
                    }
                  }}
                  className="min-w-0 cursor-pointer"
                >
                  <p className="truncate text-sm font-bold text-gray-900">{foto.nombre_empresa}</p>
                  <p className="truncate text-xs text-gray-500">{foto.nombre_trabajador}</p>
                </div>

                <button
                  type="button"
                  onClick={() => void manejarGuardarFoto(foto)}
                  className={`rounded-xl border px-3 py-1 text-xs font-semibold transition-all ${
                    fotosGuardadasSet.has(foto.id_publicacion)
                      ? 'border-blue-700 bg-white text-blue-700 hover:bg-blue-50'
                      : 'border-blue-700 bg-blue-700 text-white hover:bg-blue-800'
                  }`}
                >
                  {fotosGuardadasSet.has(foto.id_publicacion) ? 'GUARDADO' : 'GUARDAR'}
                </button>
              </header>

              <img
                src={foto.imagen_url}
                alt={`Publicación de ${foto.nombre_trabajador} en ${foto.nombre_empresa}`}
                className="w-full object-cover"
                onClick={() => navigate(`/peluqueria/${foto.id_peluqueria}`)}
              />
            </article>
          ))}
        </div>
      </main>
      <FooterUsuario />
    </div>
  )
}