import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthContext } from '../hooks/useAuthContext'
import ServiciosModal from '../components/ServiciosModal'

// Tipado de datos
type FormState = {
  nombre: string
  email: string
  ubicacion: string
  tipo_de_via: string
  calle: string
  codigo_postal: string
  horario: string
  nombre_empresa: string
}

interface ServicioLocal {
  id_servicio?: number;
  nombre_servicio: string;
  activo: number;
  precio: number;
}

export default function AjustesPage() {
  const navigate = useNavigate()
  const { token, usuario, logout } = useAuthContext()
  const esDueno = usuario?.rol === 'DUEÑO'
  const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

  // --- ESTADOS ---
  const [form, setForm] = useState<FormState>({
    nombre: '', email: '', ubicacion: '',
    tipo_de_via: '', calle: '', codigo_postal: '', horario: '', nombre_empresa: '',
  })

  const [listaServicios, setListaServicios] = useState<ServicioLocal[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalVersion, setModalVersion] = useState(0)

  const [stats, setStats] = useState({
    seguidas: 0,
    bloqueadas: 0,
    favoritos: 0,
    seguidores: 0,
    fechaCreacion: 'Cargando...',
  })

  const [imagenCabecera, setImagenCabecera] = useState<string | null>(null)
  const [subiendoCabecera, setSubiendoCabecera] = useState(false)
  const inputCabeceraRef = useRef<HTMLInputElement>(null)

  // --- MANEJADORES ---
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleCerrarSesion = () => {
    logout()
    navigate('/')
  }

  const handleVincularTelegram = async () => {
    if (!token) return alert('Inicia sesión para vincular Telegram.')
    try {
      const response = await fetch(`${apiUrl}/api/telegram/vincular`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      if (data.ok && data.enlace) {
        window.open(data.enlace, '_blank', 'noopener,noreferrer')
      }
    } catch (error) {
      console.error('Error Telegram:', error)
      alert("No se pudo generar el enlace de Telegram.")
    }
  }

  // --- CARGA DE DATOS ---
  const cargarServicios = async () => {
  if (!token || !esDueno) return;
  try {
    const resServ = await fetch(`${apiUrl}/api/userj/servicios`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const dataServ = await resServ.json();
    
    if (dataServ.ok) {
      const normalizados = dataServ.servicios.map((s: any) => {
        // LÓGICA DE DETECCIÓN TOTAL
        let valorActivo = 0;
        
        if (s.activo === true || s.activo === 1 || s.activo === "1") {
          valorActivo = 1;
        } else if (s.activo && typeof s.activo === 'object' && s.activo.data) {
          // Esto captura el formato Buffer [1] que suele enviar MySQL en Node.js
          valorActivo = s.activo.data[0] === 1 ? 1 : 0;
        }

        return {
          ...s,
          activo: valorActivo // Ahora 'activo' es SIEMPRE el número 0 o 1
        };
      });
      
      setListaServicios(normalizados);
    }
  } catch (error) {
	alert("No se pudieron cargar los servicios de la peluquería. Inténtalo de nuevo.");
  }
};

  useEffect(() => {
    const cargarTodo = async () => {
      if (!token) return
      try {
        // Carga de Perfil
        const response = await fetch(`${apiUrl}/api/usuarios/perfil`, {
          headers: { 'Authorization': `Bearer ${token}` },
        })
        const data = await response.json()
        if (data.ok && data.perfil) {
          setForm({
            nombre: data.perfil.nombre ?? '',
            email: data.perfil.email ?? '',
            ubicacion: data.perfil.ubicacion ?? '',
            tipo_de_via: data.perfil.tipo_de_via ?? '',
            calle: data.perfil.calle ?? '',
            codigo_postal: data.perfil.codigo_postal ?? '',
            horario: data.perfil.horario ?? '',
            nombre_empresa: data.perfil.nombre_empresa ?? '',
          })
          setStats({
            seguidas: data.perfil.seguidas_count ?? 0,
            bloqueadas: data.perfil.bloqueadas_count ?? 0,
            seguidores: data.perfil.numero_seguidores ?? 0,
            favoritos: data.perfil.favoritos_count ?? 0,
            fechaCreacion: data.perfil.fechaCreacion ?? '01/01/2025'
          })
          setImagenCabecera(data.perfil.imagenCabecera ?? null)
        }
        // Carga de Servicios si es dueño
        if (esDueno) await cargarServicios();
      } catch (error) { console.error("Error cargando datos:", error) }
    }
    void cargarTodo()
  }, [token, apiUrl, esDueno])

  // --- ACCIONES DE GUARDADO ---
  const handleGuardarPerfil = async () => {
    if (!token) return;

    if (esDueno) {
      const viasPermitidas = ['calle', 'avenida', 'paseo', 'plaza', 'via', 'ronda', 'bulevar', 'carretera'];
      const viaEscrita = form.tipo_de_via.toLowerCase().trim();
      if (viaEscrita && !viasPermitidas.includes(viaEscrita)) {
        alert(`Tipo de vía no válido. Use: Calle, Avenida, Paseo, Plaza...`);
        return;
      }
    }

    try {
      const response = await fetch(`${apiUrl}/api/usuarios/perfil`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(form)
      });
      const data = await response.json();
      if (data.ok) alert("¡Cambios guardados con éxito!");
      else alert("Error al guardar: " + data.message);
    } catch (error) { alert("Error al conectar con el servidor."); }
  };

  const handleSyncServicios = async (nuevosServicios: ServicioLocal[]) => {
    try {
      // Pre-procesamos los datos antes de enviarlos para que coincidan con la DB
      const serviciosProcesados = nuevosServicios.map(s => ({
        ...s,
        nombre_servicio: s.nombre_servicio.trim(),
        precio: Number(s.precio) || 0,
        activo: Number(s.activo)
      }));

      const response = await fetch(`${apiUrl}/api/userj/servicios-sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ servicios: serviciosProcesados })
      });

      const data = await response.json();

      if (data.ok) {
        // 1. Refrescamos la lista desde el servidor para obtener los nuevos IDs generados
        await cargarServicios();
        // 2. Cerramos el modal
        setIsModalOpen(false);
        // 3. Forzamos actualización de la versión del modal para la próxima vez que se abra
        setModalVersion(v => v + 1);

        alert("¡Servicios actualizados correctamente!");
      } else {
        throw new Error(data.msg || "Error al sincronizar");
      }
    } catch (error) {
      console.error("Error en handleSyncServicios:", error);
      alert("No se pudo guardar los servicios. Revisa que no haya nombres duplicados.");
    }
  };

  const handleCabeceraChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const archivo = event.target.files?.[0]
    if (!archivo || !token) return

    const formData = new FormData()
    formData.append('imagen', archivo)

    setSubiendoCabecera(true)
    try {
      const response = await fetch(`${apiUrl}/api/usuarios/perfil/cabecera`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      const data = await response.json()
      if (data.ok) {
        setImagenCabecera(data.imagenUrl)
      } else {
        alert('Error al subir la imagen: ' + (data.message ?? ''))
      }
    } catch {
      alert('No se pudo conectar con el servidor.')
    } finally {
      setSubiendoCabecera(false)
      if (inputCabeceraRef.current) inputCabeceraRef.current.value = ''
    }
  }

  // --- CONFIGURACIÓN UI ---
  const opciones = [
    ...(esDueno ? [{ label: 'Editar servicios', action: () => setIsModalOpen(true) }] : []),
    ...(!esDueno ? [{ label: 'Vincular Telegram', action: () => void handleVincularTelegram() }] : []),
    { label: 'Cambio de contraseña', action: () => navigate('/cambio-contrasena') },
    { label: 'Privacidad', action: () => navigate('/privacidad') },
    { label: 'Ayuda y soporte', action: () => navigate('/ayuda-soporte') },
    { label: 'Términos y condiciones', action: () => navigate('/terminos-y-condiciones') },
  ]

  const inputsConfig = [
    { name: 'nombre', placeholder: 'Nombre Personal', type: 'text' },
    { name: 'email', placeholder: 'Correo electrónico', type: 'email' },

  ]

  if (esDueno) {
    inputsConfig.push(
      { name: 'nombre_empresa', placeholder: 'Nombre de la Peluquería', type: 'text' },
      { name: 'horario', placeholder: 'Horario (ej: 09:00 - 20:00)', type: 'text' },
      { name: 'tipo_de_via', placeholder: 'Tipo de vía (Calle, Av, Plaza)', type: 'text' },
      { name: 'calle', placeholder: 'Nombre de la calle', type: 'text' },
      { name: 'codigo_postal', placeholder: 'Código Postal', type: 'text' }
    )
  } else {
    inputsConfig.push({ name: 'ubicacion', placeholder: 'Tu Ubicación/Ciudad', type: 'text' })
  }

  return (
    <div className="min-h-screen bg-white text-[#111111]">
      <main className="mx-auto flex max-w-6xl flex-col gap-7 p-7 pb-32 md:px-8">

        {/* Banner de cabecera */}
        <div className="group relative h-36 w-full overflow-hidden rounded-2xl border-[1.5px] border-[#727272] bg-gray-100">
          {imagenCabecera ? (
            <img
              src={imagenCabecera}
              alt="Imagen de cabecera"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">
              Sin imagen de cabecera
            </div>
          )}
          <button
            type="button"
            onClick={() => inputCabeceraRef.current?.click()}
            disabled={subiendoCabecera}
            className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100 disabled:cursor-not-allowed"
          >
            <span className="rounded-full bg-white px-4 py-2 text-xs font-bold text-[#111111] shadow">
              {subiendoCabecera ? 'Subiendo...' : 'Cambiar cabecera'}
            </span>
          </button>
          <input
            ref={inputCabeceraRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleCabeceraChange}
          />
        </div>

        {/* Perfil e Inputs */}
        <div className="flex flex-col items-start gap-10 md:flex-row">
          <div className="flex w-full max-w-[480px] flex-col gap-3">
            {inputsConfig.map((input) => (
              <input
                key={input.name}
                className="w-full rounded-full border-[1.5px] border-[#727272] bg-white px-5 py-3 text-sm outline-none transition-all focus:border-black"
                type={input.type}
                name={input.name}
                placeholder={input.placeholder}
                value={form[input.name as keyof FormState] || ''}
                onChange={handleChange}
              />
            ))}
          </div>

          <div className="flex shrink-0 items-start gap-8">
            <div className="flex flex-col items-center gap-3">
              <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-[1.5px] border-[#727272] bg-gray-100">
                <svg className="mt-4 h-20 w-20" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="50" cy="38" r="22" fill="#b0aed0" />
                  <ellipse cx="50" cy="85" rx="35" ry="22" fill="#b0aed0" />
                </svg>
              </div>
              <button className="text-xs font-bold hover:underline">Editar perfil</button>
            </div>

            <div className="space-y-1.5 pt-2 text-sm">
              <p className="text-gray-500"><span className="font-bold text-[#111111]">Creación:</span> {stats.fechaCreacion}</p>
              {esDueno ? (
                <p className="text-gray-500"><span className="font-bold text-[#111111]">Seguidores:</span> {stats.seguidores}</p>
              ) : (
                <>
                  <p className="text-gray-500"><span className="font-bold text-[#111111]">Seguidas:</span> {stats.seguidas}</p>
                  <p className="text-gray-500"><span className="font-bold text-[#111111]">Favoritos:</span> {stats.favoritos}</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Lista de Opciones */}
        <div className="overflow-hidden rounded-2xl border-[1.5px] border-[#727272] bg-white">
          {opciones.map((opcion) => (
            <button
              key={opcion.label}
              onClick={opcion.action}
              className="w-full border-b-[1.5px] border-[#727272] px-5 py-4 text-left text-sm text-gray-500 last:border-b-0 hover:bg-[#111111] hover:text-white transition-colors"
            >
              {opcion.label}
            </button>
          ))}
        </div>

        {/* Botones Inferiores */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t-[1.5px] border-[#727272] pt-6">
          <button onClick={() => navigate(-1)} className="rounded-xl border-[1.5px] border-[#111111] px-8 py-2.5 text-sm font-bold">Atrás</button>
          <div className="flex gap-3">
            <button onClick={handleCerrarSesion} className="rounded-xl border border-red-600 px-6 py-2.5 text-sm font-bold text-red-600 hover:bg-red-600 hover:text-white transition-colors">
              Cerrar sesión
            </button>
            <button onClick={handleGuardarPerfil} className="rounded-xl bg-[#111111] px-8 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:bg-black/80">
              Guardar Cambios
            </button>
          </div>
        </div>

        {/* Modal */}
        {isModalOpen && (
          <ServiciosModal
            key={`modal-v${modalVersion}-${listaServicios.length}`}
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            servicios={listaServicios}
            onSync={handleSyncServicios}
          />
        )}
      </main>
    </div>
  )
}
