import { useState, useEffect } from 'react';

interface Servicio {
  id_servicio?: number;
  nombre_servicio: string;
  activo: number;
  precio: number;
}

interface ServiciosModalProps {
  isOpen: boolean;
  onClose: () => void;
  servicios: Servicio[];
  onSync: (nuevosServicios: Servicio[]) => Promise<void>;
}

export default function ServiciosModal({ isOpen, onClose, servicios, onSync }: ServiciosModalProps) {
  // Estado local independiente para manejar la UI antes de guardar
  const [listaLocal, setListaLocal] = useState<Servicio[]>([]);
  const [nuevoServicio, setNuevoServicio] = useState({ nombre: '', precio: '' });
  const [cargando, setCargando] = useState(false);

  // Sincronización: Al abrir, nos aseguramos de que 'activo' sea un número real
  useEffect(() => {
    if (isOpen) {
      setListaLocal(servicios.map(s => ({ ...s, activo: Number(s.activo) })));
    }
  }, [isOpen, servicios]);

  if (!isOpen) return null;

  // Manejador independiente: Solo cambia el índice que tocas
  const handleToggle = (index: number) => {
    setListaLocal(prev => {
      const copia = [...prev];
      // Cambiamos el valor de ese índice específico sin tocar los demás
      const valorActual = Number(copia[index].activo);
      copia[index] = {
        ...copia[index],
        activo: valorActual === 1 ? 0 : 1
      };
      return copia;
    });
  };

  const handleAdd = () => {
    if (!nuevoServicio.nombre.trim()) return;

    const existe = listaLocal.some(
      s => s.nombre_servicio.toLowerCase() === nuevoServicio.nombre.toLowerCase()
    );
    if (existe) {
      alert("Este servicio ya existe.");
      return;
    }

    const nuevo: Servicio = {
      nombre_servicio: nuevoServicio.nombre.trim(),
      activo: 1, // Por defecto activo al crear
      precio: parseFloat(nuevoServicio.precio) || 0
    };

    setListaLocal([...listaLocal, nuevo]);
    setNuevoServicio({ nombre: '', precio: '' });
  };

  const handleConfirmar = async () => {
    try {
      setCargando(true);
      await onSync(listaLocal);
      onClose();
    } catch (error) {
      console.error("Error al sincronizar:", error);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div
        className="w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-[2rem] bg-white shadow-2xl flex flex-col border-[1.5px] border-[#727272]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b-[1.5px] border-[#727272] px-8 py-6">
          <h3 className="text-xl font-bold uppercase tracking-tight text-[#111111]">Gestionar Servicios</h3>
          <button onClick={onClose} className="text-3xl text-[#727272] hover:text-black transition-colors">&times;</button>
        </div>

        {/* Cuerpo */}
        <div className="overflow-y-auto p-8 custom-scrollbar">

          {/* Añadir Nuevo */}
          <div className="mb-8 rounded-2xl border-[1.5px] border-[#727272] bg-[#f9f9f9] p-6">
            <p className="mb-4 text-xs font-black uppercase text-[#727272]">Nuevo servicio</p>
            <div className="flex flex-wrap gap-3">
              <input
                type="text"
                placeholder="Nombre"
                className="flex-1 min-w-[200px] rounded-full border-[1.5px] border-[#727272] px-5 py-2.5 text-sm outline-none focus:border-black transition-all"
                value={nuevoServicio.nombre}
                onChange={(e) => setNuevoServicio({ ...nuevoServicio, nombre: e.target.value })}
              />
              <input
                type="number"
                placeholder="€"
                className="w-24 rounded-full border-[1.5px] border-[#727272] px-5 py-2.5 text-sm outline-none focus:border-black transition-all"
                value={nuevoServicio.precio}
                onChange={(e) => setNuevoServicio({ ...nuevoServicio, precio: e.target.value })}
              />
              <button onClick={handleAdd} className="rounded-full bg-[#111111] px-6 py-2.5 text-sm font-bold text-white hover:scale-105 transition-all">+ Añadir</button>
            </div>
          </div>

          {/* Grid de Servicios */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {listaLocal.map((s, index) => {
              // Verificación estricta
              const isGreen = Number(s.activo) === 1;

              return (
                <div
                  key={s.id_servicio || `temp-${index}`}
                  className={`flex items-center justify-between rounded-xl border-2 p-4 mb-2 ${isGreen ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'
                    }`}
                >
                  <div className="flex flex-col">
                    <span className={`font-bold ${isGreen ? 'text-green-700' : 'text-red-700'}`}>
                      {s.nombre_servicio}
                    </span>
                    <span className="text-xs text-gray-500">
                      {Number(s.precio).toFixed(2)}€
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggle(index)}
                    className={`rounded-full px-4 py-1 text-[10px] font-black uppercase ${isGreen ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                      }`}
                  >
                    {isGreen ? 'Activo' : 'Inactivo'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Acciones */}
        <div className="border-t-[1.5px] border-[#727272] px-8 py-6 flex gap-4 bg-white">
          <button onClick={onClose} className="flex-1 rounded-full border-[1.5px] border-[#111111] py-3 text-sm font-bold">Descartar</button>
          <button
            onClick={handleConfirmar}
            disabled={cargando}
            className="flex-1 rounded-full bg-black py-3 text-sm font-bold text-white disabled:opacity-50"
          >
            {cargando ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>
    </div>
  );
}