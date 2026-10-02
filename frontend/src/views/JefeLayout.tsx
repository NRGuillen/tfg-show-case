import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuthContext } from "../hooks/useAuthContext"
import { useState, useEffect } from 'react'

export default function AdminLayout() {
  const location = useLocation();
  const { usuario } = useAuthContext();
  const [imagenPeluqueria, setImagenPeluqueria] = useState<string | null>(null);

  const esDueno = usuario?.rol === 'DUEÑO';

  useEffect(() => {
    const idPeluqueria = usuario?.idPeluqueria;
    if (!idPeluqueria) return;

    const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
    fetch(`${apiUrl}/api/fotos/${idPeluqueria}/detalle`)
      .then(res => res.json())
      .then(data => {
        if (data.ok && data.peluqueria?.imagen) {
          setImagenPeluqueria(data.peluqueria.imagen);
        }
      })
      .catch(() => { });
  }, [usuario?.idPeluqueria]);

  const isActive = (path: string) => location.pathname === path;

  const linkBaseClass = "px-6 py-5 font-semibold text-sm uppercase tracking-wider flex items-center gap-3 transition-all";
  const linkActiveClass = "border-b-4 border-blue-600 text-blue-700 bg-blue-50/50";
  const linkInactiveClass = "text-gray-500 hover:text-gray-900 hover:bg-gray-100/50 border-b-4 border-transparent";

  return (
    <div className="min-h-screen bg-[#F9FAFB]">

      {/* 1. Header del Perfil */}
      <header
        className="relative border-b border-gray-100 overflow-hidden"
        style={imagenPeluqueria ? {
          backgroundImage: `url(${imagenPeluqueria})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        } : { backgroundColor: 'white' }}
      >
        {imagenPeluqueria && <div className="absolute inset-0 bg-black/55" />}
        <div className="relative max-w-7xl mx-auto px-6 py-20 flex items-end justify-between">
          <div className='flex items-center gap-4'>

            {/* Contenedor blanco sólido */}
            <div className='h-24 w-24 bg-white flex items-center justify-center overflow-hidden'>
              <img
                src="/img/logo.png"
                alt="logo"
                className="h-full w-auto object-contain scale-[1.7]"
              />
            </div>

            <div>
              <h1 className={`text-4xl font-black uppercase tracking-tighter ${imagenPeluqueria ? 'text-white drop-shadow-lg' : 'text-gray-950'}`}>
                Altioram <span className={imagenPeluqueria ? 'text-blue-300' : 'text-blue-600'}>Business</span>
              </h1>
              <p className={`font-medium text-lg mt-1 ${imagenPeluqueria ? 'text-gray-200 drop-shadow' : 'text-gray-500'}`}>
                Panel de Gestión de Negocio
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* 2. Menú de gestión FILTRADO */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm overflow-x-auto">
        <div className="max-w-7xl mx-auto flex gap-1 px-6 min-w-max">

          <Link to="/userJ/posts" className={`${linkBaseClass} ${isActive('/userJ/posts') ? linkActiveClass : linkInactiveClass}`}>
            Publicaciones
          </Link>

          <Link
            to="/userJ/agenda" // Antes decía /userJ/stats-global
            className={`${linkBaseClass} ${isActive('/userJ/agenda') ? linkActiveClass : linkInactiveClass}`}
          >
            Agenda
          </Link>

          <Link to="/userJ/shop" className={`${linkBaseClass} ${isActive('/userJ/shop') ? linkActiveClass : linkInactiveClass}`}>
            Tienda
          </Link>

          {/* SOLO SI ES DUEÑO aparezcan estos dos */}
          {esDueno && (
            <>
              <Link to="/userJ/contratacion" className={`${linkBaseClass} ${isActive('/userJ/contratacion') ? linkActiveClass : linkInactiveClass}`}>
                Contratación
              </Link>

              <Link to="/userJ/analytics" className={`${linkBaseClass} ${isActive('/userJ/analytics') ? linkActiveClass : linkInactiveClass}`}>
                Estadísticas
              </Link>

              <Link
                to="/userJ/ajustes"
                className={`${linkBaseClass} ${isActive('/userJ/ajustes') ? linkActiveClass : linkInactiveClass}`}
              >
                Ajustes
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* 3. Contenido Principal */}
      <main className="max-w-7xl mx-auto p-6 md:p-10 animate-fade-in">
        <div className="bg-white rounded-3xl shadow-xl shadow-gray-100/50 border border-gray-100 p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
