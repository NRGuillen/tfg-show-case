import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthContext } from '../hooks/useAuthContext'

export default function CambioContrasenaPage() {
  const navigate = useNavigate()
  const { usuario } = useAuthContext()
  const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

  const [email, setEmail] = useState(usuario?.email ?? '')
  const [loading, setLoading] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setMensaje('')
    setError('')

    if (!email.trim()) {
      setError('Introduce un correo valido.')
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`${apiUrl}/api/usuarios/password/reset-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      const data = await response.json().catch(() => null)

      if (!response.ok || !data?.ok) {
        throw new Error(data?.message ?? 'No se pudo enviar el correo.')
      }

      setMensaje(data.message ?? 'Si el correo existe, te enviaremos un enlace de recuperacion.')
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Error enviando la solicitud')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white text-[#111111]">
      <main className="mx-auto flex max-w-3xl flex-col gap-6 p-7 pb-24 md:px-8">
        <h1 className="text-3xl font-bold">Cambio de contraseña</h1>
        <section className="rounded-2xl border-[1.5px] border-[#727272] bg-white p-6">
          <p className="mb-4 text-sm text-gray-600">
            Te enviaremos un enlace por correo para crear una nueva contraseña.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="tuemail@dominio.com"
              className="w-full rounded-full border-[1.5px] border-[#727272] bg-white px-5 py-3 text-sm text-[#111111] outline-none transition-all placeholder:text-gray-400 focus:border-black"
            />

            {mensaje ? <p className="text-sm font-semibold text-green-600">{mensaje}</p> : null}
            {error ? <p className="text-sm font-semibold text-red-600">{error}</p> : null}

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="rounded-full border-[1.5px] border-[#111111] px-6 py-2.5 text-sm font-bold"
              >
                Volver
              </button>
              <button
                type="submit"
                disabled={loading}
                className="rounded-full border-[1.5px] border-[#111111] bg-[#111111] px-6 py-2.5 text-sm font-bold text-white transition-all hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Enviando...' : 'Enviar enlace'}
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  )
}
