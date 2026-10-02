import { Link, useLocation } from 'react-router-dom'

const iconWrapperClass =
  'flex h-11 w-11 items-center justify-center rounded-lg border-2 bg-white transition-all'

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5.5 9.8V20h13V9.8" />
      <path d="M10 20v-5h4v5" />
    </svg>
  )
}

export default function FooterUsuario() {
  const location = useLocation()

  return (
    <nav className="fixed right-0 bottom-0 left-0 z-[200] border-t border-gray-200 bg-white py-6">
      <div className="mx-auto flex max-w-screen-xl justify-between px-20 md:px-40 lg:px-60">
        <Link to="/inicio" className="no-underline">
          <div
            className={`${iconWrapperClass} ${
              location.pathname === '/inicio'
                ? 'border-black text-black'
                : 'border-gray-400 text-gray-700 hover:border-black hover:text-black'
            }`}
          >
            <HomeIcon />
          </div>
        </Link>

        <Link to="/busqueda" className="no-underline">
          <div
            className={`${iconWrapperClass} ${
              location.pathname === '/busqueda'
                ? 'border-black text-black'
                : 'border-gray-400 text-gray-700 hover:border-black hover:text-black'
            }`}
          >
            <span className="text-xl font-bold leading-none">⌕</span>
          </div>
        </Link>

        <Link to="/fotos-favoritas" className="no-underline">
          <div
            className={`${iconWrapperClass} ${
              location.pathname === '/fotos-favoritas'
                ? 'border-black text-black'
                : 'border-gray-400 text-gray-700 hover:border-black hover:text-black'
            }`}
          >
            <span className="text-xl font-bold leading-none">☆</span>
          </div>
        </Link>
      </div>
    </nav>
  )
}