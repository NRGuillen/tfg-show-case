import FooterUsuario from '../components/FooterUsuario'
import Header from '../components/HeaderUsuario'
import HomePage from './HomePage'

export default function IndexPage() {
  return (
    <div className="min-h-screen bg-white text-[#111111]">
      <Header />
      <HomePage />
      <FooterUsuario />
    </div>
  )
}