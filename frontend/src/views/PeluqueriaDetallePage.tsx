import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Header from '../components/HeaderUsuario'
import CalendarioReservas from '../components/CalendarioReservas'
import { useAuthContext } from '../hooks/useAuthContext'
import type { PeluqueriaDetalle, PublicacionPeluqueria } from '../types/photoCard'

export default function PeluqueriaDetallePage() {
  const { id } = useParams()
  const { token } = useAuthContext()
  const navigate = useNavigate() // Hook para navegar
  const [peluqueria, setPeluqueria] = useState<PeluqueriaDetalle | null>(null)
  const [loading, setLoading] = useState(true)
  const [siguiendo, setSiguiendo] = useState(false)
  const [modalCalendarioAbierto, setModalCalendarioAbierto] = useState(false)
  const [reservaConfirmada, setReservaConfirmada] = useState<string | null>(null)
  const [publicaciones, setPublicaciones] = useState<PublicacionPeluqueria[]>([])
  const [fotosGuardadas, setFotosGuardadas] = useState<number[]>([])
  const [modalResenaAbierto, setModalResenaAbierto] = useState(false)
  const [estrellasResena, setEstrellasResena] = useState(5)
  const [errorResena, setErrorResena] = useState<string | null>(null)

  const idNumerico = useMemo(() => Number(id), [id])

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

    const cargarDetalle = async () => {
      if (Number.isNaN(idNumerico)) {
        setPeluqueria(null)
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`${apiUrl}/api/fotos/${idNumerico}/detalle`)
        const result = await response.json()

        if (response.ok && result.ok && result.peluqueria) {
          setPeluqueria(result.peluqueria as PeluqueriaDetalle)
          const publicacionesResponse = await fetch(`${apiUrl}/api/fotos/${idNumerico}/publicaciones`)
          const publicacionesResult = await publicacionesResponse.json()
          const publicacionesCargadas =
            publicacionesResponse.ok && publicacionesResult.ok && Array.isArray(publicacionesResult.publicaciones)
              ? (publicacionesResult.publicaciones as PublicacionPeluqueria[])
              : []

          setPublicaciones(publicacionesCargadas)

          if (token) {
            const followResponse = await fetch(`${apiUrl}/api/fotos/${idNumerico}/seguir`, {
              headers: {
                Authorization: `Bearer ${token}`
              }
            })
            const followResult = await followResponse.json()

            if (followResponse.ok && followResult.ok) {
              setSiguiendo(Boolean(followResult.siguiendo))
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
              const publicacionesGuardadas = publicacionesCargadas
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
            setSiguiendo(false)
            setFotosGuardadas([])
          }
        } else {
          setPeluqueria(null)
          setPublicaciones([])
          setFotosGuardadas([])
        }
      } catch (error) {
        console.error('Error cargando detalle de peluquería:', error)
        setPeluqueria(null)
        setPublicaciones([])
        setFotosGuardadas([])
      } finally {
        setLoading(false)
      }
    }

    void cargarDetalle()
  }, [idNumerico, token])


  const manejarSeguir = async () => {
    if (!peluqueria) return

    if (!token) {
      alert('Debes iniciar sesión para seguir peluquerías')
      return
    }

    const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'
    const metodo = siguiendo ? 'DELETE' : 'POST'

    try {
      const response = await fetch(`${apiUrl}/api/fotos/${peluqueria.id_peluqueria}/seguir`, {
        method: metodo,
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      const result = await response.json()

      if (!response.ok || !result.ok) {
        alert(result.message ?? 'No se pudo actualizar el seguimiento')
        return
      }

      setSiguiendo(!siguiendo)
      setPeluqueria((prev) =>
        prev
          ? {
              ...prev,
              numero_seguidores: Number(result.numeroSeguidores ?? prev.numero_seguidores)
            }
          : prev
      )
    } catch (error) {
      console.error('Error actualizando seguimiento:', error)
      alert('Error al actualizar el seguimiento')
    }
  }

  const manejarGuardarFoto = async (publicacion: PublicacionPeluqueria) => {
    if (!token) {
      alert('Debes iniciar sesión para guardar fotos favoritas')
      return
    }

    const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'
    const yaGuardada = fotosGuardadas.includes(publicacion.id_publicacion)

    try {
      const response = await fetch(`${apiUrl}/api/fotos/fotos-favoritas`, {
        method: yaGuardada ? 'DELETE' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          url: publicacion.imagen_url,
          id_personal: publicacion.id_personal,
          id_peluqueria: publicacion.id_peluqueria
        })
      })

      const result = await response.json()

      if (!response.ok || !result.ok) {
        alert(result.message ?? 'No se pudo actualizar la foto')
        return
      }

      setFotosGuardadas((prev) =>
        yaGuardada
          ? prev.filter((idPublicacion) => idPublicacion !== publicacion.id_publicacion)
          : [...prev, publicacion.id_publicacion]
      )
    } catch (error) {
      console.error('Error guardando foto favorita:', error)
      alert('Error al actualizar la foto favorita')
    }
  }


  const manejarEnviarResena = async () => {
    if (!token || !peluqueria) {
      setErrorResena('Debes iniciar sesión para poner una reseña')
      return
    }

    const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

    try {
      const response = await fetch(`${apiUrl}/api/fotos/${peluqueria.id_peluqueria}/resena`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ estrellas: estrellasResena})
      })

      const result = await response.json()

      if (!response.ok || !result.ok) {
        setErrorResena(result.message ?? 'No se pudo enviar la reseña')
        return
      }

      setPeluqueria((prev) =>
        prev
          ? {
              ...prev,
              puntuacion: Number(result.puntuacion ?? prev.puntuacion),
              reviews: Number(result.reviews ?? prev.reviews)
            }
          : prev
      )
      setErrorResena(null)
      setEstrellasResena(5)
      setModalResenaAbierto(false)
    } catch (error) {
      console.error('Error enviando reseña:', error)
      setErrorResena('Error al enviar la reseña')
    }
  }

return (
    <div className="min-h-screen bg-[#F9FAFB] text-[#111111]">
      <Header />

      <main className="w-full px-0 py-8 pb-16">
        {loading ? (
          <p className="px-6 text-lg font-semibold md:px-10">Cargando peluquería...</p>
        ) : !peluqueria ? (
          <p className="px-6 text-lg font-semibold md:px-10">No se encontró la peluquería seleccionada.</p>
        ) : (
          <>
            <section className="mb-4 w-full rounded-none border-y border-gray-200 bg-white px-6 py-6 shadow-sm md:px-10">
              <div className="flex min-h-40 flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                  <h1 className="text-4xl font-black uppercase tracking-tight text-blue-700">{peluqueria.nombre_empresa}</h1>
                  <p className="mt-1 text-base text-gray-700">
                    {peluqueria.tipo_de_via} {peluqueria.calle} {peluqueria.codigo_postal}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-lg text-yellow-400">★</span>
                    <span className="text-base font-bold text-gray-900">{peluqueria.puntuacion}</span>
                    <span className="text-sm text-gray-500">({peluqueria.reviews} reseñas)</span>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">{peluqueria.numero_seguidores} seguidores</p>
                </div>

                <div className="h-44 w-full overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 md:w-[58%]">
                  <img
                    src={peluqueria.imagen}
                    alt={peluqueria.nombre_empresa}
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            </section>

            <section className="mb-4 flex flex-wrap gap-4 px-6 md:px-10">
              <button
                type="button"
                onClick={manejarSeguir}
                className={`rounded-xl border px-8 py-2.5 text-sm font-bold shadow-sm transition-all ${
                  siguiendo
                    ? 'border-blue-700 bg-white text-blue-700 hover:bg-blue-50'
                    : 'border-blue-700 bg-blue-700 text-white hover:bg-blue-800'
                }`}
              >
                {siguiendo ? 'SIGUIENDO' : 'SEGUIR'}
              </button>

              {/* BOTÓN DE TIENDA CONFIGURADO */}
              <button 
                type="button" 
                onClick={() => navigate(`/shop/${id}`)}
                className="rounded-xl border border-blue-700 bg-blue-700 px-8 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-blue-800"
              >
                TIENDA
              </button>

              <button
                type="button"
                onClick={() => setModalCalendarioAbierto(true)}
                className="rounded-xl border border-blue-700 bg-blue-700 px-8 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-blue-800"
              >
                CALENDARIO DE RESERVAS
              </button>

              <button
                type="button"
                onClick={() => {
                  setModalResenaAbierto(true)
                  setErrorResena(null)
                }}
                className="rounded-xl border border-blue-700 bg-blue-700 px-8 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-blue-800"
              >
                PONER RESEÑA
              </button>
            </section>

            {reservaConfirmada && (
              <p className="mx-6 mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700 md:mx-10">
                Reserva confirmada para el {reservaConfirmada}.
              </p>
            )}

            <section className="grid grid-cols-1 gap-6 px-6 md:grid-cols-2 md:px-10 lg:grid-cols-3">
              {/* Contenido de publicaciones */}
              {Array.isArray(publicaciones) && publicaciones.length > 0 ? (
                publicaciones.map((publicacion) => (
                  <article
                    key={publicacion.id_publicacion}
                    className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
                  >
                    <header className="flex items-center justify-between border-b border-gray-100 p-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full border border-gray-300 bg-gray-100" />
                        <div>
                          <p className="text-base leading-none text-gray-700">{publicacion.nombre_trabajador}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => void manejarGuardarFoto(publicacion)}
                        className={`rounded-xl border px-3 py-1 text-xs font-semibold transition-all ${
                          fotosGuardadas.includes(publicacion.id_publicacion)
                            ? 'border-blue-700 bg-white text-blue-700 hover:bg-blue-50'
                            : 'border-blue-700 bg-blue-700 text-white hover:bg-blue-800'
                        }`}
                      >
                        {fotosGuardadas.includes(publicacion.id_publicacion) ? 'GUARDADO' : 'GUARDAR'}
                      </button>
                    </header>
                    <img src={publicacion.imagen_url} alt="Publicación de la peluquería" className="w-full object-cover" />
                  </article>
                ))
              ) : (
                <div className="col-span-full py-20 text-center">
                  <p className="text-gray-400 text-xl italic">No hay fotos subidas en esta peluquería.</p>
                </div>
              )}
            </section>

            <CalendarioReservas
              idPeluqueria={idNumerico}
              token={token}
              isOpen={modalCalendarioAbierto}
              onClose={() => setModalCalendarioAbierto(false)}
              onConfirmar={({ fecha, hora }) => setReservaConfirmada(`${fecha} a las ${hora}`)}
            />
          </>
        )}
        {modalResenaAbierto && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
              <h3 className="text-lg font-bold text-gray-900">Poner reseña</h3>
              <div className="mt-4">
                <label className="mb-1 block text-sm font-semibold text-gray-700">Estrellas</label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((estrella) => (
                    <button
                      key={estrella}
                      type="button"
                      onClick={() => setEstrellasResena(estrella)}
                      className="text-3xl leading-none"
                      aria-label={`Poner ${estrella} estrella${estrella > 1 ? 's' : ''}`}
                    >
                      <span className={estrella <= estrellasResena ? 'text-yellow-400' : 'text-gray-300'}>★</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-4 flex items-center justify-end gap-2">
                {errorResena && <span className="text-sm font-semibold text-red-600">{errorResena}</span>}
                <button
                  type="button"
                  onClick={() => setModalResenaAbierto(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => void manejarEnviarResena()}
                  className="rounded-lg border border-blue-700 bg-blue-700 px-4 py-2 text-sm font-bold text-white"
                >
                  Enviar
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}