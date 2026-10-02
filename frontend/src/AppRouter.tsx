import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './views/LoginPage';
import RegisterPage from './views/RegisterPage';
import IndexPage from './views/IndexPage';
import ShopPage from './views/ShopPage';
import JefeLayout from './views/JefeLayout';
import AgendaPage from './views/AgendaPage';
import { GestionContratacion } from './components/GestionContratacion';
import { useAuthContext } from './hooks/useAuthContext';
import BusquedaPage from './views/BusquedaPage';
import PeluqueriaDetallePage from './views/PeluqueriaDetallePage';
import AjustesPage from './views/AjustesPage';
import PostsView from './views/PostsView';
import FotosFavoritasPage from './views/FotosFavoritasPage';
import AnalyticsPage from './views/AnalyticsPage'
import PrivacidadPage from './views/PrivacidadPage'
import TerminosCondicionesPage from './views/TerminosCondicionesPage'
import AyudaSoportePage from './views/AyudaSoportePage'
import UsuarioPage from './views/UsuarioPage'
import CambioContrasenaPage from './views/CambioContrasenaPage'
import ResetPasswordPage from './views/ResetPasswordPage'

export default function AppRouter() {
  const { usuario, loading } = useAuthContext();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d0d0f] flex items-center justify-center text-white">
        Cargando...
      </div>
    );
  }

  // Función para redirigir según rol
  const redirectByRole = () => {
    if (!usuario) return <LoginPage />;
    // Si es DUEÑO o PERSONAL, van al panel de gestión
    if (usuario.rol === 'DUEÑO' || usuario.rol === 'PERSONAL') {
      return <Navigate to="/userJ" />;
    }

    // Si tienes otros roles (como CLIENTE), van al index
    return <Navigate to="/inicio" />;
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta principal */}
        <Route path="/" element={redirectByRole()} />

        {/* Login */}
        <Route path="/login" element={redirectByRole()} />

        {/* Registro */}
        <Route path="/registro" element={<RegisterPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Páginas accesibles solo si hay usuario */}
        <Route path="/inicio" element={usuario ? <IndexPage /> : <Navigate to="/" />} />
        <Route path="/busqueda" element={usuario ? <BusquedaPage /> : <Navigate to="/" />} />
        <Route path="/peluqueria/:id" element={usuario ? <PeluqueriaDetallePage /> : <Navigate to="/" />} />
        <Route path="/fotos-favoritas" element={usuario ? <FotosFavoritasPage /> : <Navigate to="/" />} />
        <Route path="/ajustes" element={usuario ? <AjustesPage /> : <Navigate to="/" />} />
        <Route path="/cambio-contrasena" element={<CambioContrasenaPage />} />
        <Route path="/usuario" element={usuario?.rol === 'CLIENTE' ? <UsuarioPage /> : <Navigate to="/" />} />
        <Route path="/privacidad" element={usuario ? <PrivacidadPage /> : <Navigate to="/" />} />
        <Route path="/terminos-y-condiciones" element={usuario ? <TerminosCondicionesPage /> : <Navigate to="/" />} />
        <Route path="/ayuda-soporte" element={usuario ? <AyudaSoportePage /> : <Navigate to="/" />} />
        <Route path="/shop/:idPeluqueria" element={usuario ? <ShopPage /> : <Navigate to="/" />} />

        {/* Layout de Jefe */}
        <Route path="/userJ" element={usuario?.rol === 'DUEÑO' || usuario?.rol === 'PERSONAL' ? <JefeLayout /> : <Navigate to="/" />}>
          <Route index element={<Navigate to="agenda" replace />} />
          <Route path="posts" element={<PostsView />} />
          <Route path="agenda" element={<AgendaPage />} />
          <Route path="contratacion" element={<GestionContratacion />} />
          <Route path="shop" element={<ShopPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="ajustes" element={usuario ? <AjustesPage /> : <Navigate to="/" />} />
          <Route path="cambio-contrasena" element={usuario ? <CambioContrasenaPage /> : <Navigate to="/" />} />
          <Route path="privacidad" element={usuario ? <PrivacidadPage /> : <Navigate to="/" />} />
          <Route path="terminos-y-condiciones" element={usuario ? <TerminosCondicionesPage /> : <Navigate to="/" />} />
          <Route path="ayuda-soporte" element={usuario ? <AyudaSoportePage /> : <Navigate to="/" />} />
        </Route>

        {/* Ruta comodín */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}