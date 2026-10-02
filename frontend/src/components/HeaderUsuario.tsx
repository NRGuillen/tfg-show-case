import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthContext } from '../hooks/useAuthContext'

const navIconClassName = 'text-xl leading-none'

type Notificacion = {
  id_notificacion: number
  mensaje: string
  fecha: string
}

export default function Header() {
  const location = useLocation()
  const navigate = useNavigate()
  const { token } = useAuthContext()
  const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'
  const [menuAbierto, setMenuAbierto] = useState<'notificaciones' | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([])
  const [cargandoNotificaciones, setCargandoNotificaciones] = useState(false)
  const [puntoRojoVisible, setPuntoRojoVisible] = useState(false)

  const cargarNotificaciones = async () => {
    if (!token) {
      setNotificaciones([])
      setPuntoRojoVisible(false)
      return
    }

    setCargandoNotificaciones(true)

    try {
      const response = await fetch(`${apiUrl}/api/fotos/notificaciones`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const result = await response.json()

      if (!response.ok || !result.ok) {
        throw new Error(result.message ?? 'No se pudieron cargar las notificaciones')
      }

      const listado = Array.isArray(result.notificaciones) ? (result.notificaciones as Notificacion[]) : []
      setNotificaciones(listado)
      setPuntoRojoVisible(listado.length > 0 && menuAbierto !== 'notificaciones')
    } catch (error) {
      console.error('Error cargando notificaciones:', error)
      setNotificaciones([])
      setPuntoRojoVisible(false)
    } finally {
      setCargandoNotificaciones(false)
    }
  }

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search)
    setBusqueda(searchParams.get('q') ?? '')
  }, [location.search])

  useEffect(() => {
    void cargarNotificaciones()
  }, [token])

  useEffect(() => {
    const handleClickFuera = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuAbierto(null)
      }
    }

    document.addEventListener('mousedown', handleClickFuera)
    return () => document.removeEventListener('mousedown', handleClickFuera)
  }, [])

  const toggleMenu = (menu: 'notificaciones') => {
    setMenuAbierto((actual) => {
      const siguiente = actual === menu ? null : menu
      if (menu === 'notificaciones' && siguiente === 'notificaciones') {
        setPuntoRojoVisible(false)
        void cargarNotificaciones()
      }
      return siguiente
    })
  }

  const eliminarNotificacion = async (idNotificacion: number) => {
    if (!token) {
      return
    }

    try {
      const response = await fetch(`${apiUrl}/api/fotos/notificaciones/${idNotificacion}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const result = await response.json()

      if (!response.ok || !result.ok) {
        throw new Error(result.message ?? 'No se pudo eliminar la notificación')
      }

      setNotificaciones((actuales) => actuales.filter((item) => item.id_notificacion !== idNotificacion))
    } catch (error) {
      console.error('Error eliminando notificación:', error)
    }
  }

  const handleBusquedaChange = (value: string) => {
    setBusqueda(value)

    const searchParams = new URLSearchParams(location.search)
    const valueNormalizado = value.trim()

    if (valueNormalizado) {
      searchParams.set('q', valueNormalizado)
    } else {
      searchParams.delete('q')
    }

    const queryString = searchParams.toString()
    navigate(
      {
        pathname: location.pathname,
        search: queryString ? `?${queryString}` : '',
      },
      { replace: true }
    )
  }

  return (
    <header className="sticky top-0 z-[100] flex items-center border-b border-gray-200 bg-white px-6 py-3">
      {/* Contenedor principal: asegura que todo esté en una sola fila */}
      <div className="flex w-full items-center justify-between gap-4 flex-nowrap">

        <div className="flex items-center flex-shrink-0">
          <Link to="/index" className="no-underline flex items-center gap-4">
            {/* Contenedor del Logo: Mantiene h-24 y w-24 sin deformarse */}
            <div className='h-24 w-24 bg-white flex items-center justify-center overflow-hidden flex-shrink-0'>
              <img
                src="/img/logo.png"
                alt="logo"
                className="h-full w-auto object-contain scale-[1.7]"
              />
            </div>

            {/* Texto del Logo: Nivelado con la imagen. Se oculta en móviles muy pequeños para dar espacio al buscador */}
            <h1 className="text-2xl md:text-3xl font-black tracking-tighter text-gray-950 uppercase leading-none hidden sm:block">
              Altioram <span className="text-blue-600">Style</span>
            </h1>
          </Link>
        </div>

        {/* Buscador: flex-grow hace que ocupe el espacio central y empuje el resto a la derecha */}
        <div className="flex flex-grow max-w-md items-center rounded-full border border-gray-200 bg-gray-100 px-4 py-2 mx-2 md:mx-6">
          <span className="text-gray-400 text-lg">⌕</span>
          <input
            type="text"
            placeholder="Buscar..."
            value={busqueda}
            onChange={(event) => handleBusquedaChange(event.target.value)}
            className="ml-2 w-full border-none bg-transparent text-sm text-gray-700 outline-none focus:ring-0"
          />
        </div>

        {/* Navegación Derecha: Se mantiene al final de la línea */}
        <nav className="flex items-center gap-4 md:gap-8 flex-shrink-0">
          <div className="relative">
            <button
              type="button"
              onClick={() => toggleMenu('notificaciones')}
              className="flex cursor-pointer flex-col items-center text-gray-400 hover:text-black"
            >
              <span className={`relative ${navIconClassName}`}>
                🔔
                {puntoRojoVisible && (
                  <span className="absolute -top-1 -right-2 block h-2.5 w-2.5 rounded-full bg-red-500" />
                )}
              </span>
              <span className="mt-1 text-[10px] font-bold hidden md:block">Notificaciones</span>
            </button>

            {menuAbierto === 'notificaciones' && (
              <div className="absolute top-12 right-0 md:right-1/2 z-[220] max-h-80 w-80 md:translate-x-1/2 overflow-y-auto rounded-xl border border-gray-200 bg-white p-2 shadow-lg">
                <div className="mb-1 flex items-center justify-between px-2 py-1">
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Notificaciones</p>
                </div>
                {cargandoNotificaciones ? (
                  <p className="px-2 py-3 text-sm text-gray-500">Cargando...</p>
                ) : notificaciones.length === 0 ? (
                  <p className="px-2 py-3 text-sm text-gray-500">No tienes notificaciones.</p>
                ) : (
                  <ul className="space-y-2">
                    {notificaciones.map((notificacion) => (
                      <li key={notificacion.id_notificacion} className="rounded-lg border border-gray-100 p-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm text-gray-700">{notificacion.mensaje}</p>
                            <p className="mt-1 text-xs text-gray-500">{notificacion.fecha}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => eliminarNotificacion(notificacion.id_notificacion)}
                            className="cursor-pointer rounded-md p-1 text-sm text-gray-500 transition hover:bg-red-50 hover:text-red-600"
                          >
                            🗑️
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          <div
            onClick={() => navigate('/ajustes')}
            className="flex cursor-pointer flex-col items-center text-gray-400 hover:text-black"
          >
            <span className={navIconClassName}>⚙️</span>
            <span className="mt-1 text-[10px] font-bold hidden md:block">Ajustes</span>
          </div>

          <div
            onClick={() => navigate('/usuario')}
            className="flex cursor-pointer flex-col items-center text-gray-400 hover:text-black"
          >
            <span className={navIconClassName}>👤</span>
            <span className="mt-1 text-[10px] font-bold hidden md:block">Usuario</span>
          </div>
        </nav>
      </div>
    </header>
  )
}
