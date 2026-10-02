import { Outlet } from 'react-router-dom'
import Header from '../components/HeaderUsuario'

export default function WebLayout() {
  return (
    <div className="min-h-screen bg-white text-[#111111]">
      <Header />
      <Outlet />
    </div>
  )
}