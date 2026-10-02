import { useEffect, useMemo, useState } from 'react'

type ServicioReserva = {
  id_servicio: number
  nombre_servicio: string
  precio: number
}

type EmpleadoReserva = {
  id_personal: number
  nombre: string
}

type ReservaExistente = {
  hora: string
  idPersonal: number
}

type ReservasDiaResponse = {
  reservas?: ReservaExistente[]
  horasReservadas?: string[]
}

type CalendarioReservasProps = {
  idPeluqueria: number
  token: string | null
  isOpen: boolean
  onClose: () => void
  onConfirmar: (reserva: { fecha: string; hora: string; servicio: string; empleado: string }) => void
}

const NOMBRES_DIAS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

const generarHorasPorHorario = (horario: string | null): string[] => {
  if (!horario || !horario.includes('-')) {
    return []
  }

  const [inicioRaw, finRaw] = horario.split('-').map((value) => value.trim())
  if (!/^\d{2}:\d{2}$/.test(inicioRaw) || !/^\d{2}:\d{2}$/.test(finRaw)) {
    return []
  }

  const [inicioHora, inicioMinuto] = inicioRaw.split(':').map(Number)
  const [finHora, finMinuto] = finRaw.split(':').map(Number)

  const inicioTotalMinutos = inicioHora * 60 + inicioMinuto
  const finTotalMinutos = finHora * 60 + finMinuto

  if (Number.isNaN(inicioTotalMinutos) || Number.isNaN(finTotalMinutos) || finTotalMinutos <= inicioTotalMinutos) {
    return []
  }

  const horas: string[] = []
  for (let minutos = inicioTotalMinutos; minutos < finTotalMinutos; minutos += 30) {
    const horasStr = String(Math.floor(minutos / 60)).padStart(2, '0')
    const minutosStr = String(minutos % 60).padStart(2, '0')
    horas.push(`${horasStr}:${minutosStr}`)
  }

  return horas
}

export default function CalendarioReservas({
  idPeluqueria,
  token,
  isOpen,
  onClose,
  onConfirmar,
}: CalendarioReservasProps) {
  const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'
  const fechaActual = useMemo(() => new Date(), [])

  const [diaSeleccionado, setDiaSeleccionado] = useState<number | null>(null)
  const [horaSeleccionada, setHoraSeleccionada] = useState('')
  const [servicioSeleccionado, setServicioSeleccionado] = useState('')
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState('')
  const [reservasDia, setReservasDia] = useState<ReservaExistente[]>([])
  const [horasReservadasGenerales, setHorasReservadasGenerales] = useState<string[]>([])
  const [servicios, setServicios] = useState<ServicioReserva[]>([])
  const [empleados, setEmpleados] = useState<EmpleadoReserva[]>([])
  const [cargandoHoras, setCargandoHoras] = useState(false)
  const [cargandoOpciones, setCargandoOpciones] = useState(false)
  const [horarioPeluqueria, setHorarioPeluqueria] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const anio = fechaActual.getFullYear()
  const mes = fechaActual.getMonth()
  const diaActual = fechaActual.getDate()

  const nombreMes = fechaActual.toLocaleDateString('es-ES', {
    month: 'long',
    year: 'numeric',
  })

  const diasDelMes = new Date(anio, mes + 1, 0).getDate()
  const primerDiaMes = new Date(anio, mes, 1)
  const offsetPrimerDia = (primerDiaMes.getDay() + 6) % 7

  const celdasCalendario = [
    ...Array.from({ length: offsetPrimerDia }, (_, index) => ({ key: `empty-${index}`, dia: null })),
    ...Array.from({ length: diasDelMes }, (_, index) => ({ key: `day-${index + 1}`, dia: index + 1 })),
  ]

  const fechaIsoSeleccionada = useMemo(() => {
    if (!diaSeleccionado) {
      return null
    }

    const mm = String(mes + 1).padStart(2, '0')
    const dd = String(diaSeleccionado).padStart(2, '0')

    return `${anio}-${mm}-${dd}`
  }, [anio, mes, diaSeleccionado])

  const empleadosOcupadosEnHora = useMemo(() => {
    if (!horaSeleccionada) {
      return new Set<number>()
    }

    return new Set(
      reservasDia.filter((reserva) => reserva.hora === horaSeleccionada).map((reserva) => reserva.idPersonal)
    )
  }, [reservasDia, horaSeleccionada])

  const empleadosDisponibles = useMemo(
    () => empleados.filter((empleado) => !empleadosOcupadosEnHora.has(empleado.id_personal)),
    [empleados, empleadosOcupadosEnHora]
  )

  const horasDisponiblesBase = useMemo(() => generarHorasPorHorario(horarioPeluqueria), [horarioPeluqueria])

  const horasDisponiblesFiltradas = useMemo(
    () =>
      horasDisponiblesBase.filter((hora) => {
        if (horasReservadasGenerales.includes(hora)) {
          return false
        }

        if (fechaIsoSeleccionada) {
          const [year, month, day] = fechaIsoSeleccionada.split('-').map(Number)
          const [horaSeleccionada, minutoSeleccionado] = hora.split(':').map(Number)

          if (
            !Number.isNaN(year) &&
            !Number.isNaN(month) &&
            !Number.isNaN(day) &&
            !Number.isNaN(horaSeleccionada) &&
            !Number.isNaN(minutoSeleccionado)
          ) {
            const fechaHoraSlot = new Date(year, month - 1, day, horaSeleccionada, minutoSeleccionado, 0, 0)
            if (fechaHoraSlot.getTime() <= Date.now()) {
              return false
            }
          }
        }

        const empleadosOcupados = reservasDia.filter((reserva) => reserva.hora === hora).length
        return empleados.length > 0 && empleadosOcupados < empleados.length
      }),
    [fechaIsoSeleccionada, reservasDia, empleados, horasReservadasGenerales, horasDisponiblesBase]
  )

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const cargarOpciones = async () => {
      setCargandoOpciones(true)
      setError(null)

      try {
        const response = await fetch(`${apiUrl}/api/fotos/${idPeluqueria}/opciones-reserva`)
        const result = await response.json()

        if (!response.ok || !result.ok) {
          throw new Error(result.message ?? 'No se pudieron cargar servicios y empleados')
        }

        setServicios(Array.isArray(result.servicios) ? result.servicios : [])
        setEmpleados(Array.isArray(result.empleados) ? result.empleados : [])
        setHorarioPeluqueria(typeof result.horario === 'string' ? result.horario : null)
      } catch (errorCarga) {
        console.error('Error cargando opciones de reserva:', errorCarga)
        setServicios([])
        setEmpleados([])
        setHorarioPeluqueria(null)
        setError('No se pudieron cargar los servicios o empleados.')
      } finally {
        setCargandoOpciones(false)
      }
    }

    void cargarOpciones()
  }, [apiUrl, idPeluqueria, isOpen])

  useEffect(() => {
    if (!isOpen || !fechaIsoSeleccionada) {
      setReservasDia([])
      setHorasReservadasGenerales([])
      setHoraSeleccionada('')
      setEmpleadoSeleccionado('')
      return
    }

    const cargarReservas = async () => {
      setError(null)
      setCargandoHoras(true)

      try {
        const response = await fetch(`${apiUrl}/api/fotos/${idPeluqueria}/reservas?fecha=${fechaIsoSeleccionada}`)
        const result = await response.json().catch(() => null)

        if (!response.ok) {
          throw new Error((result as { message?: string } | null)?.message ?? 'No se pudieron cargar las reservas de ese día')
        }

        const reservas = (result as ReservasDiaResponse | null)?.reservas
        const horasReservadas = (result as ReservasDiaResponse | null)?.horasReservadas
        setReservasDia(Array.isArray(reservas) ? reservas : [])
        setHorasReservadasGenerales(Array.isArray(horasReservadas) ? horasReservadas : [])
      } catch (errorCarga) {
        console.error('Error cargando reservas:', errorCarga)
        setReservasDia([])
        setHorasReservadasGenerales([])
        setError('No se pudieron cargar las reservas del día.')
      } finally {
        setCargandoHoras(false)
      }
    }

    void cargarReservas()
  }, [apiUrl, idPeluqueria, isOpen, fechaIsoSeleccionada])

  useEffect(() => {
    setEmpleadoSeleccionado('')
  }, [horaSeleccionada])

  const confirmarReserva = async () => {
    if (!diaSeleccionado || !horaSeleccionada || !fechaIsoSeleccionada || !servicioSeleccionado || !empleadoSeleccionado) {
      return
    }

    if (!token) {
      setError('Debes iniciar sesión para reservar.')
      return
    }

    setError(null)

    try {
      const response = await fetch(`${apiUrl}/api/fotos/${idPeluqueria}/reservas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fecha: fechaIsoSeleccionada,
          hora: horaSeleccionada,
          idServicio: Number(servicioSeleccionado),
          idPersonal: Number(empleadoSeleccionado),
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.ok) {
        throw new Error(result.message ?? 'No se pudo crear la reserva')
      }

      const fechaReserva = new Date(anio, mes, diaSeleccionado)
      const fechaFormateada = fechaReserva.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })

      const servicio = servicios.find((item) => item.id_servicio === Number(servicioSeleccionado))
      const empleado = empleados.find((item) => item.id_personal === Number(empleadoSeleccionado))

      onConfirmar({
        fecha: fechaFormateada,
        hora: horaSeleccionada,
        servicio: servicio?.nombre_servicio ?? 'Servicio',
        empleado: empleado?.nombre ?? 'Empleado',
      })

      setDiaSeleccionado(null)
      setHoraSeleccionada('')
      setServicioSeleccionado('')
      setEmpleadoSeleccionado('')
      setReservasDia([])
      setHorasReservadasGenerales([])
      onClose()
    } catch (errorReserva) {
      console.error('Error creando reserva:', errorReserva)
      setError(errorReserva instanceof Error ? errorReserva.message : 'Error creando la reserva')
    }
  }

  const cerrarModal = () => {
    setDiaSeleccionado(null)
    setHoraSeleccionada('')
    setServicioSeleccionado('')
    setEmpleadoSeleccionado('')
    setReservasDia([])
    setHorasReservadasGenerales([])
    setError(null)
    onClose()
  }

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
      <div className="w-full max-w-3xl rounded-3xl bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-2xl font-black uppercase tracking-tight text-gray-950">Calendario de reservas</h2>
          <button type="button" onClick={cerrarModal} className="text-3xl leading-none text-gray-500 hover:text-gray-800">
            ×
          </button>
        </header>

        <div className="grid gap-6 p-6 md:grid-cols-[1fr_280px]">
          <section>
            <p className="mb-4 text-lg font-bold capitalize text-gray-900">{nombreMes}</p>

            <div className="mb-2 grid grid-cols-7 gap-2">
              {NOMBRES_DIAS.map((nombreDia) => (
                <span key={nombreDia} className="text-center text-sm font-bold text-gray-900">
                  {nombreDia}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {celdasCalendario.map((celda) => {
                const esDiaPasado = celda.dia !== null && celda.dia < diaActual

                return (
                  <button
                    key={celda.key}
                    type="button"
                    onClick={() => celda.dia && !esDiaPasado && setDiaSeleccionado(celda.dia)}
                    disabled={!celda.dia || esDiaPasado}
                    className={`h-10 rounded-lg text-sm font-semibold transition ${
                      celda.dia
                        ? esDiaPasado
                          ? 'cursor-not-allowed border border-gray-100 bg-gray-100 text-gray-400'
                          : diaSeleccionado === celda.dia
                          ? 'border border-blue-700 bg-blue-700 text-white'
                            : 'border border-blue-200 bg-white text-gray-900 hover:bg-blue-50'
                        : 'cursor-default bg-transparent'
                    }`}
                  >
                    {celda.dia ?? ''}
                  </button>
                )
              })}
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <h3 className="text-base font-black uppercase tracking-tight text-gray-950">Reserva</h3>

            {diaSeleccionado ? (
              <p className="mt-2 text-sm text-gray-900">
                Día seleccionado: <span className="font-bold">{diaSeleccionado}</span>
              </p>
            ) : (
              <p className="mt-2 text-sm text-gray-900">Selecciona un día para continuar.</p>
            )}

            <label htmlFor="servicio-reserva" className="mt-4 block text-sm font-bold text-gray-900">
              Servicio
            </label>
            <select
              id="servicio-reserva"
              value={servicioSeleccionado}
              onChange={(event) => setServicioSeleccionado(event.target.value)}
              disabled={cargandoOpciones}
              className="mt-1 w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm text-gray-900 disabled:cursor-not-allowed disabled:bg-gray-100"
            >
              <option value="">{cargandoOpciones ? 'Cargando servicios...' : 'Selecciona un servicio'}</option>
              {servicios.map((servicio) => (
                <option key={servicio.id_servicio} value={servicio.id_servicio}>
                  {servicio.nombre_servicio} - {servicio.precio.toFixed(2)}€
                </option>
              ))}
            </select>

            <label htmlFor="hora-reserva" className="mt-4 block text-sm font-bold text-gray-900">
              Hora
            </label>
            <select
              id="hora-reserva"
              value={horaSeleccionada}
              onChange={(event) => setHoraSeleccionada(event.target.value)}
              disabled={!diaSeleccionado || cargandoHoras || cargandoOpciones}
              className="mt-1 w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm text-gray-900 disabled:cursor-not-allowed disabled:bg-gray-100"
            >
              <option value="">{cargandoHoras ? 'Cargando horas...' : 'Selecciona una hora'}</option>
              {horasDisponiblesFiltradas.map((hora) => (
                <option key={hora} value={hora}>
                  {hora}
                </option>
              ))}
            </select>

            <label htmlFor="empleado-reserva" className="mt-4 block text-sm font-bold text-gray-900">
              Empleado
            </label>
            <select
              id="empleado-reserva"
              value={empleadoSeleccionado}
              onChange={(event) => setEmpleadoSeleccionado(event.target.value)}
              disabled={!horaSeleccionada || cargandoHoras || cargandoOpciones}
              className="mt-1 w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm text-gray-900 disabled:cursor-not-allowed disabled:bg-gray-100"
            >
              <option value="">{cargandoOpciones ? 'Cargando empleados...' : 'Selecciona un empleado'}</option>
              {empleadosDisponibles.map((empleado) => (
                <option key={empleado.id_personal} value={empleado.id_personal}>
                  {empleado.nombre}
                </option>
              ))}
            </select>

            {diaSeleccionado && !cargandoHoras && horasDisponiblesBase.length > 0 && horasDisponiblesFiltradas.length === 0 && (
              <p className="mt-2 text-xs font-semibold text-red-600">No quedan horas disponibles para este día.</p>
            )}
            {diaSeleccionado && !cargandoHoras && horasDisponiblesBase.length === 0 && (
              <p className="mt-2 text-xs font-semibold text-red-600">
                Esta peluquería no tiene un horario válido configurado.
              </p>
            )}

            {horaSeleccionada && !cargandoHoras && empleadosDisponibles.length === 0 && (
              <p className="mt-2 text-xs font-semibold text-red-600">No quedan empleados disponibles a esa hora.</p>
            )}

            {error && <p className="mt-2 text-xs font-semibold text-red-600">{error}</p>}

            <button
              type="button"
              onClick={confirmarReserva}
              disabled={
                !diaSeleccionado ||
                !horaSeleccionada ||
                !servicioSeleccionado ||
                !empleadoSeleccionado ||
                cargandoHoras ||
                cargandoOpciones
              }
              className="mt-6 w-full rounded-xl border border-blue-700 bg-blue-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:border-gray-400 disabled:bg-gray-400"
            >
              Confirmar
            </button>
          </section>
        </div>
      </div>
    </div>
  )
}