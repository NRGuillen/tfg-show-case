import { useEffect, useState } from 'react';
import { useAuthContext } from '../hooks/useAuthContext';
import type { Reserva } from '../types/bookingTypes';

// Tipos locales para asegurar que TypeScript no se queje
type UsuarioBusqueda = {
  id_usuario: number;
  nombre: string;
  apellido_1: string;
};

type Servicio = {
  id_servicio: number;
  nombre_servicio: string;
  precio: number;
};

export default function AgendaPage() {
  const { token } = useAuthContext();
  const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

  // --- ESTADOS ---
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date().toISOString().split('T')[0]);
  const [tramos, setTramos] = useState<{ hora: string; reservas: Reserva[] }[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  
  // Estados Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [horaSeleccionada, setHoraSeleccionada] = useState('');
  const [emailBusqueda, setEmailBusqueda] = useState('');
  const [usuarioEncontrado, setUsuarioEncontrado] = useState<UsuarioBusqueda | null>(null);
  const [servicioSeleccionado, setServicioSeleccionado] = useState<string>('');
  const [notasForm, setNotasForm] = useState('');
  const [cargandoBusqueda, setCargandoBusqueda] = useState(false);

  // 1. CARGAR DATOS (Usa tu ruta: /api/userJ/agenda)
  const cargarDatos = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/userJ/agenda?fecha=${fechaSeleccionada}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.ok) {
        // data.horario viene de tu SELECT horario FROM peluqueria
        procesarAgenda(data.horario, data.reservas);
      }
    } catch (err) {
      console.error("Error al cargar agenda:", err);
    }
  };

  // Cargar Servicios (Usa tu ruta: /api/userJ/servicios)
  const cargarServicios = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/userJ/servicios`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.ok) setServicios(data.servicios);
    } catch (err) {
      console.error("Error al cargar servicios:", err);
    }
  };

  const procesarAgenda = (horarioStr: string, reservas: Reserva[]) => {
    if (!horarioStr || !horarioStr.includes('-')) return;
    const [inicio, fin] = horarioStr.split('-');
    const listaTramos = [];
    
    let actual = new Date(`2024-01-01T${inicio.trim()}:00`);
    const tope = new Date(`2024-01-01T${fin.trim()}:00`);
    const seguraReservas = Array.isArray(reservas) ? reservas : [];

    while (actual < tope) {
      const horaHHMM = actual.toTimeString().slice(0, 5); // Genera "09:00", "09:30"...
      
      // Filtramos las reservas que coinciden con esta hora
      // Como tu Service ya hace el DATE_FORMAT(..., '%H:%i'), 
      // r.hora_reserva ya debería ser "09:30". Usamos includes por seguridad.
      const reservasEnEstaHora = seguraReservas.filter(r => 
        r.hora_reserva && r.hora_reserva.includes(horaHHMM)
      );
      
      listaTramos.push({ 
        hora: horaHHMM, 
        reservas: reservasEnEstaHora 
      });
      actual.setMinutes(actual.getMinutes() + 30);
    }
    setTramos(listaTramos);
  };

  useEffect(() => { 
    cargarDatos(); 
    cargarServicios();
  }, [fechaSeleccionada]);

  // 2. BUSCAR CLIENTE (Usa tu ruta: /api/userJ/buscar-cliente)
  const buscarCliente = async () => {
    if (!emailBusqueda) return;
    setCargandoBusqueda(true);
    try {
      const res = await fetch(`${apiUrl}/api/userJ/buscar-cliente?email=${emailBusqueda}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.ok) {
        setUsuarioEncontrado(data.usuario);
      } else {
        setUsuarioEncontrado(null);
        alert("Cliente no encontrado.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCargandoBusqueda(false);
    }
  };

  // 3. FORZAR CITA (Usa tu ruta: /api/userJ/forzar-reserva)
  const confirmarForzarCita = async () => {
    if (!servicioSeleccionado) return alert("Selecciona un servicio");

    try {
      const res = await fetch(`${apiUrl}/api/userJ/forzar-reserva`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          id_usuario_cliente: usuarioEncontrado?.id_usuario || 720001, // Tu ID por defecto
          fecha: fechaSeleccionada,
          hora: horaSeleccionada,
          id_servicio: parseInt(servicioSeleccionado),
          notas: notasForm
        })
      });

      if (res.ok) {
        cerrarModal();
        cargarDatos(); // Recargamos para ver la nueva cita
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 4. CANCELAR (Usa tu ruta: /api/userJ/reserva/:id)
  const cancelarReserva = async (id: number) => {
    if (!confirm("¿Eliminar esta cita?")) return;
    try {
      const res = await fetch(`${apiUrl}/api/userJ/reserva/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) cargarDatos();
    } catch (err) {
      console.error(err);
    }
  };

  const cerrarModal = () => {
    setIsModalOpen(false);
    setUsuarioEncontrado(null);
    setEmailBusqueda('');
    setNotasForm('');
    setServicioSeleccionado('');
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* HEADER */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex justify-between items-center">
        <h2 className="text-2xl font-black uppercase text-gray-800">Agenda</h2>
        <input 
          type="date" 
          value={fechaSeleccionada} 
          onChange={(e) => setFechaSeleccionada(e.target.value)}
          className="font-bold text-blue-600 border-none outline-none"
        />
      </div>

      {/* LISTA DE TRAMOS */}
      <div className="space-y-3">
        {tramos.map((item) => {
          const tieneForzada = item.reservas.some(r => Number(r.id_usuario) === 720001);

          return (
            <div key={item.hora} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${item.reservas.length > 0 ? 'bg-blue-50 border-blue-100' : 'bg-white border-gray-50'}`}>
              <div className="flex items-center gap-6">
                <span className="text-lg font-bold text-blue-700 w-12">{item.hora}</span>
                
                <div className="flex flex-col gap-2">
                  {item.reservas.length > 0 ? (
                    item.reservas.map(res => (
                      <div key={res.id_reserva} className="flex items-center gap-3 bg-white p-2 px-3 rounded-xl shadow-sm border border-blue-50">
                        <div className="flex flex-col">
                          <span className={`text-xs font-black uppercase ${Number(res.id_usuario) === 720001 ? 'text-amber-600' : 'text-gray-700'}`}>
                            {Number(res.id_usuario) === 720001 ? `📝 ${res.notas || 'Manual'}` : res.nombre_cliente}
                          </span>
                          <span className="text-[9px] font-bold text-blue-400 uppercase">{res.estado}</span>
                        </div>
                        <button onClick={() => cancelarReserva(res.id_reserva)} className="text-red-400 hover:text-red-600 text-xs font-bold ml-2">✕</button>
                      </div>
                    ))
                  ) : (
                    <span className="text-gray-300 italic text-sm">Disponible</span>
                  )}
                </div>
              </div>

              <button 
                onClick={() => { setHoraSeleccionada(item.hora); setIsModalOpen(true); }}
                disabled={tieneForzada}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${tieneForzada ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-green-100 text-green-700 hover:bg-green-600 hover:text-white'}`}
              >
                {tieneForzada ? 'Ocupado' : 'Forzar'}
              </button>
            </div>
          );
        })}
      </div>

      {/* MODAL (Simplificado) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl space-y-4">
            <h3 className="text-center font-black uppercase text-gray-800">Nueva Cita - {horaSeleccionada}</h3>
            
            <div className="space-y-3">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Email cliente..." 
                  className="flex-1 bg-gray-50 p-3 rounded-xl text-sm"
                  value={emailBusqueda}
                  onChange={(e) => setEmailBusqueda(e.target.value)}
                />
                <button onClick={buscarCliente} className="bg-blue-600 text-white px-4 rounded-xl">🔍</button>
              </div>
              {usuarioEncontrado && <p className="text-[10px] font-bold text-green-600 uppercase text-center">✅ Seleccionado: {usuarioEncontrado.nombre}</p>}

              <select 
                className="w-full bg-gray-50 p-3 rounded-xl text-sm font-bold"
                value={servicioSeleccionado}
                onChange={(e) => setServicioSeleccionado(e.target.value)}
              >
                <option value="">¿Qué servicio?</option>
                {servicios.map(s => <option key={s.id_servicio} value={s.id_servicio}>{s.nombre_servicio}</option>)}
              </select>

              <textarea 
                placeholder="Nombre o notas..." 
                className="w-full bg-gray-50 p-3 rounded-xl text-sm h-20 resize-none"
                value={notasForm}
                onChange={(e) => setNotasForm(e.target.value)}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={cerrarModal} className="flex-1 py-3 font-bold text-gray-400 uppercase text-xs">Cancelar</button>
              <button onClick={confirmarForzarCita} className="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold uppercase text-xs">Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}