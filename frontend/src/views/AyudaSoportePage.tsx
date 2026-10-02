import { useNavigate } from 'react-router-dom'

const faqItems = [
  {
    pregunta: '¿Cómo modifico mis datos de perfil?',
    respuesta: 'En Ajustes puedes editar tus datos y pulsar en Guardar para actualizar la información.',
  },
  {
    pregunta: '¿Cómo encuentro una peluquería?',
    respuesta: 'Usa la búsqueda principal para filtrar por nombre, ubicación o servicios.',
  },
  {
    pregunta: '¿Cómo marco una peluquería como favorita?',
    respuesta: 'Desde la vista de una peluquería podrás guardarla para verla luego en tus favoritos.',
  },
  {
    pregunta: '¿Qué hago si tengo un problema con una reserva?',
    respuesta: 'Contacta con soporte desde este apartado y revisa los detalles de la reserva en tu agenda.',
  },
]

export default function AyudaSoportePage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-white text-[#111111]">
      <main className="mx-auto flex max-w-4xl flex-col gap-6 p-7 pb-24 md:px-8">
        <h1 className="text-3xl font-bold">Ayuda y soporte</h1>
        <section className="rounded-2xl border-[1.5px] border-[#727272] bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold">FAQ general</h2>
          <div className="space-y-4">
            {faqItems.map((item) => (
              <div key={item.pregunta}>
                <p className="font-semibold text-[#111111]">{item.pregunta}</p>
                <p className="text-sm text-gray-700">{item.respuesta}</p>
              </div>
            ))}
          </div>
        </section>
        <div>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-full border-[1.5px] border-[#111111] px-8 py-2.5 text-sm font-bold"
          >
            Volver
          </button>
        </div>
      </main>
    </div>
  )
}
