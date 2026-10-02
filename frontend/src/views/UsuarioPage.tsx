import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/HeaderUsuario'
import { useAuthContext } from '../hooks/useAuthContext'

type PerfilBasico = {
  nombre?: string
  email?: string
  fotoUrl?: string | null
  imagenCabecera?: string | null
}

type CitaUsuario = {
  idPeluqueria: number
  peluqueria: string
  fecha: string
  hora: string | null
  servicio: string | null
  empleado: string | null
  estado: string | null
}

type PeluqueriaCard = {
  id: number
  salon: string
}

type CortePreferido = {
  nombre: string
  idPeluqueria: number
  peluqueria: string
}

export default function UsuarioPage() {
  const navigate = useNavigate()
  const { token, usuario } = useAuthContext()
  const apiUrl = useMemo(() => import.meta.env.VITE_API_URL ?? 'http://localhost:3000', [])

  const [perfil, setPerfil] = useState<PerfilBasico | null>(null)
  const [citas, setCitas] = useState<CitaUsuario[]>([])
  const [peluqueriasFavoritas, setPeluqueriasFavoritas] = useState<PeluqueriaCard[]>([])
  const [loadingPerfil, setLoadingPerfil] = useState(true)
  const [loadingCitas, setLoadingCitas] = useState(true)
  const [loadingFavoritos, setLoadingFavoritos] = useState(true)
  const [debugCitas, setDebugCitas] = useState<unknown>(null)
  const [seccionActiva, setSeccionActiva] = useState<'me-gusta' | 'peluquero-preferido' | 'citas'>('me-gusta')

  useEffect(() => {
    const cargarPerfil = async () => {
      if (!token) {
        setPerfil(null)
        setLoadingPerfil(false)
        return
      }

      setLoadingPerfil(true)
      try {
        const response = await fetch(`${apiUrl}/api/usuarios/perfil`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await response.json().catch(() => null)
        if (response.ok && data?.ok && data?.perfil) {
          setPerfil(data.perfil as PerfilBasico)
        } else {
          setPerfil(null)
        }
      } catch (error) {
        console.error('Error cargando perfil:', error)
        setPerfil(null)
      } finally {
        setLoadingPerfil(false)
      }
    }

    void cargarPerfil()
  }, [apiUrl, token])

  useEffect(() => {
    const cargarFavoritos = async () => {
      if (!token) {
        setPeluqueriasFavoritas([])
        setLoadingFavoritos(false)
        return
      }

      setLoadingFavoritos(true)
      try {
        const [favoritosResponse, peluqueriasResponse] = await Promise.all([
          fetch(`${apiUrl}/api/fotos/favoritos`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${apiUrl}/api/fotos`),
        ])

        const favoritosData = await favoritosResponse.json().catch(() => null)
        const peluqueriasData = await peluqueriasResponse.json().catch(() => null)

        const idsFavoritos = Array.isArray(favoritosData?.favoritos) ? (favoritosData.favoritos as number[]) : []
        const peluquerias = Array.isArray(peluqueriasData) ? (peluqueriasData as PeluqueriaCard[]) : []
        const favoritas = peluquerias.filter((peluqueria) => idsFavoritos.includes(Number(peluqueria.id)))

        setPeluqueriasFavoritas(favoritas)
      } catch (error) {
        console.error('Error cargando peluquerias favoritas:', error)
        setPeluqueriasFavoritas([])
      } finally {
        setLoadingFavoritos(false)
      }
    }

    void cargarFavoritos()
  }, [apiUrl, token])

  useEffect(() => {
    const cargarCitas = async () => {
      if (!token) {
        setCitas([])
        setLoadingCitas(false)
        setDebugCitas(null)
        return
      }

      setLoadingCitas(true)
      try {
        const response = await fetch(`${apiUrl}/api/usuarios/citas`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await response.json().catch(() => null)
        if (response.ok && data?.ok && Array.isArray(data?.citas)) {
          setCitas(data.citas as CitaUsuario[])
        } else {
          setCitas([])
        }
      } catch (error) {
        console.error('Error cargando citas:', error)
        setCitas([])
      } finally {
        setLoadingCitas(false)
      }
    }

    void cargarCitas()
  }, [apiUrl, token])

  // useEffect(() => {
  //   const cargarDebug = async () => {
  //     if (!import.meta.env.DEV || !token || loadingCitas || citas.length > 0) {
  //       return
  //     }

  //     try {
  //       const response = await fetch(`${apiUrl}/api/usuarios/citas?debug=1`, {
  //         headers: { Authorization: `Bearer ${token}` },
  //       })
  //       const data = await response.json().catch(() => null)
  //       setDebugCitas(data)
  //       console.info('Debug citas:', data)
  //     } catch (error) {
  //       console.error('Error cargando debug de citas:', error)
  //       setDebugCitas({ ok: false, error: String(error) })
  //     }
  //   }

  //   void cargarDebug()
  // }, [apiUrl, citas.length, loadingCitas, token])

  useEffect(() => {
    if (window.location.hash === '#citas') {
      const target = document.getElementById('citas')
      target?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [])

  const nombre = perfil?.nombre ?? usuario?.nombre ?? 'Usuario'
  const iniciales = nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((parte: string) => parte[0]?.toUpperCase())
    .join('')

  const peluquerosPreferidos = useMemo<CortePreferido[]>(() => {
    const mapa = new Map<string, CortePreferido>()

    citas.forEach((cita) => {
      const nombrePeluquero = cita.empleado?.trim()
      if (!nombrePeluquero || nombrePeluquero === '-') return

      const key = `${nombrePeluquero.toLowerCase()}-${cita.idPeluqueria}`
      if (!mapa.has(key)) {
        mapa.set(key, {
          nombre: nombrePeluquero,
          idPeluqueria: cita.idPeluqueria,
          peluqueria: cita.peluqueria,
        })
      }
    })

    return Array.from(mapa.values())
  }, [citas])

  return (
    <div className="min-h-screen bg-white text-[#111111]">
      <Header />

      <main className="mx-auto flex max-w-6xl flex-col gap-6 p-7 pb-32 md:px-8">
        <section className="flex w-full flex-col gap-5 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-gradient-to-br from-[#31435C] to-[#b0aed0] text-xl font-extrabold text-white">
              {perfil?.imagenCabecera ? (
                <img src={perfil.imagenCabecera} alt={nombre} className="h-full w-full object-cover" />
              ) : (
                iniciales || 'U'
              )}
            </div>

            <div>
              <h1 className="text-2xl font-black tracking-tight text-blue-700">
                {loadingPerfil ? 'Cargando perfil...' : nombre}
              </h1>
              <p className="mt-1 text-sm text-gray-600">{perfil?.email ?? ''}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigate('/ajustes')}
              className="rounded-xl border border-blue-700 bg-blue-700 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-blue-800"
            >
              Ajustes
            </button>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-blue-200 bg-white shadow-sm">
          <div className="grid grid-cols-3">
            <button
              type="button"
              onClick={() => setSeccionActiva('me-gusta')}
               className={`border-r border-blue-200 px-4 py-3 text-sm font-bold transition-colors ${
                seccionActiva === 'me-gusta' ? 'bg-blue-700 text-white' : 'text-blue-700 hover:bg-blue-50'
              }`}
            >
              Me gusta
            </button>
            <button
              type="button"
              onClick={() => setSeccionActiva('peluquero-preferido')}
               className={`border-r border-blue-200 px-4 py-3 text-sm font-bold transition-colors ${
                seccionActiva === 'peluquero-preferido' ? 'bg-blue-700 text-white' : 'text-blue-700 hover:bg-blue-50'
              }`}
            >
              Peluquero preferido
            </button>
            <button
              type="button"
              onClick={() => setSeccionActiva('citas')}
              className={`px-4 py-3 text-sm font-bold transition-colors ${
                seccionActiva === 'citas' ? 'bg-blue-700 text-white' : 'text-blue-700 hover:bg-blue-50'
              }`}
            >
              Citas
            </button>
          </div>
        </section>

        {seccionActiva === 'me-gusta' ? (
          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <header className="mb-4">
              <h2 className="text-lg font-black text-blue-700">Me gusta</h2>
            </header>

            <article>
              <h3 className="mb-3 text-sm font-extrabold uppercase tracking-wide text-gray-500">Peluquerías</h3>
              {loadingFavoritos ? (
                <p className="text-sm text-gray-600">Cargando peluquerías...</p>
              ) : peluqueriasFavoritas.length === 0 ? (
                <p className="text-sm text-gray-600">Todavía no has dado me gusta a ninguna peluquería.</p>
              ) : (
                <ul className="space-y-2">
                  {peluqueriasFavoritas.map((peluqueria) => (
                    <li
                      key={peluqueria.id}
                      onClick={() => navigate(`/peluqueria/${peluqueria.id}`)}
                      className="cursor-pointer rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-800 transition-colors hover:bg-gray-50"
                    >
                      {peluqueria.salon}
                    </li>
                  ))}
                </ul>
              )}
            </article>
          </section>
        ) : null}

        {seccionActiva === 'peluquero-preferido' ? (
          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <header className="mb-4">
              <h2 className="text-lg font-black text-blue-700">Peluquero preferido</h2>
            </header>
            {loadingCitas ? (
              <p className="text-sm text-gray-600">Cargando peluqueros...</p>
            ) : peluquerosPreferidos.length === 0 ? (
              <p className="text-sm text-gray-600">Todavía no tienes peluqueros preferidos guardados.</p>
            ) : (
              <ul className="space-y-2">
                {peluquerosPreferidos.map((corte) => (
                  <li
                    key={`${corte.nombre}-${corte.idPeluqueria}`}
                    onClick={() => navigate(`/peluqueria/${corte.idPeluqueria}`)}
                    className="cursor-pointer rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-800 transition-colors hover:bg-gray-50"
                  >
                    {corte.nombre}
                    <span className="ml-2 text-xs font-medium text-gray-500">({corte.peluqueria})</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : null}

        {seccionActiva === 'citas' ? (
          <section id="citas" className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <header className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-black text-blue-700">Mis citas</h2>
              <span className="text-sm font-semibold text-gray-500">
                {loadingCitas ? 'Cargando...' : `${citas.length} ${citas.length === 1 ? 'cita' : 'citas'}`}
              </span>
            </header>

            {loadingCitas ? (
              <p className="text-sm font-semibold text-gray-600">Cargando citas...</p>
            ) : citas.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-5 py-10 text-center">
                <p className="text-sm font-semibold text-gray-600">Todavia no tienes citas registradas.</p>
                <p className="mt-1 text-xs text-gray-500">Reserva desde el calendario de una peluqueria y apareceran aqui.</p>
                {import.meta.env.DEV && debugCitas ? (
                  <pre className="mx-auto mt-6 max-w-3xl overflow-auto rounded-xl border border-gray-200 bg-white p-4 text-left text-[11px] text-gray-600">
                    {JSON.stringify(debugCitas, null, 2)}
                  </pre>
                ) : null}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {citas.map((cita, idx) => (
                  <article key={`${cita.idPeluqueria}-${cita.fecha}-${cita.hora ?? 'sin-hora'}-${idx}`} className="rounded-2xl border border-gray-200 bg-white p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-base font-extrabold text-gray-900">{cita.peluqueria}</h3>
                        <p className="mt-1 text-sm font-semibold text-gray-600">
                          {cita.fecha}
                          {cita.hora ? ` · ${cita.hora}` : ''}
                        </p>
                      </div>
                      {cita.estado ? (
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-extrabold uppercase ${
                            cita.estado.toUpperCase() === 'PENDIENTE'
                              ? 'bg-yellow-100 text-yellow-800'
                              : cita.estado.toUpperCase() === 'CANCELADA'
                                ? 'bg-red-100 text-red-700'
                                : cita.estado.toUpperCase() === 'CONFIRMADA'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {/* {cita.estado} */}
                        </span>
                      ) : null}
                    </div>

                    <dl className="mt-4 grid grid-cols-1 gap-2 text-sm text-gray-700">
                      <div className="flex items-center justify-between gap-3">
                        <dt className="font-bold text-gray-500">Servicio</dt>
                        <dd className="font-semibold text-gray-800">{cita.servicio ?? '-'}</dd>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <dt className="font-bold text-gray-500">Empleado</dt>
                        <dd className="font-semibold text-gray-800">{cita.empleado ?? '-'}</dd>
                      </div>
                    </dl>
                  </article>
                ))}
              </div>
            )}
          </section>
        ) : null}
      </main>
    </div>
  )
}
