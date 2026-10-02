import { useMemo, useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const apiUrl = useMemo(() => import.meta.env.VITE_API_URL ?? 'http://localhost:3000', [])

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setMensaje('')
    setError('')

    if (!token) {
      setError('Token de recuperacion no encontrado en la URL.')
      return
    }

    if (password.length < 4) {
      setError('La contrasena debe tener al menos 4 caracteres.')
      return
    }

    if (password !== confirmPassword) {
      setError('Las contrasenas no coinciden.')
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`${apiUrl}/api/usuarios/password/reset-confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })

      const data = await response.json().catch(() => null)
      if (!response.ok || !data?.ok) {
        throw new Error(data?.message ?? 'No se pudo actualizar la contrasena.')
      }

      setMensaje('Contrasena actualizada. Ya puedes iniciar sesion.')
      setTimeout(() => navigate('/login'), 1200)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Error actualizando la contrasena')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white text-[#111111]">
      <main className="mx-auto flex max-w-3xl flex-col gap-6 p-7 pb-24 md:px-8">
        <h1 className="text-3xl font-bold">Restablecer contraseña</h1>
        <section className="rounded-2xl border-[1.5px] border-[#727272] bg-white p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Nueva contrasena"
              className="w-full rounded-full border-[1.5px] border-[#727272] bg-white px-5 py-3 text-sm text-[#111111] outline-none transition-all placeholder:text-gray-400 focus:border-black"
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Repite la nueva contrasena"
              className="w-full rounded-full border-[1.5px] border-[#727272] bg-white px-5 py-3 text-sm text-[#111111] outline-none transition-all placeholder:text-gray-400 focus:border-black"
            />

            {mensaje ? <p className="text-sm font-semibold text-green-600">{mensaje}</p> : null}
            {error ? <p className="text-sm font-semibold text-red-600">{error}</p> : null}

            <button
              type="submit"
              disabled={loading}
              className="rounded-full border-[1.5px] border-[#111111] bg-[#111111] px-6 py-2.5 text-sm font-bold text-white transition-all hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Guardando...' : 'Guardar nueva contraseña'}
            </button>
          </form>
        </section>
      </main>
    </div>
  )
}
