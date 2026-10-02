import React, { useState } from 'react';

interface Empleado {
  id_usuario: number;
  nombre: string;
  email: string;
  rol: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  staff: Empleado[];
  onFire: (id: number) => void;
}

export const ModalBajaEmployee = ({ isOpen, onClose, staff, onFire }: Props) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  // Filtramos la lista en tiempo real por nombre o email
  const filteredStaff = staff.filter(emp =>
    emp.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div 
        className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header del Modal */}
        <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Dar de Baja Personal</h2>
            <p className="text-gray-500 text-sm font-medium mt-1">Selecciona al empleado que cesará su actividad.</p>
          </div>
          <button 
            onClick={onClose}
            className="h-10 w-10 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-400 hover:text-gray-900 hover:border-gray-900 transition-all"
          >
            ✕
          </button>
        </div>

        {/* Buscador */}
        <div className="px-8 py-4">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30">🔍</span>
            <input 
              type="text"
              placeholder="Buscar por nombre o email..."
              className="w-full bg-gray-100 border-none rounded-2xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-red-500/20 transition-all outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Lista de Empleados */}
        <div className="px-8 pb-8 max-h-[400px] overflow-y-auto custom-scrollbar">
          {filteredStaff.length > 0 ? (
            <div className="grid gap-3">
              {filteredStaff.map((empleado) => (
                <div 
                  key={empleado.id_usuario} 
                  className="group flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl hover:border-red-200 hover:bg-red-50/30 transition-all duration-300"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-gray-100 rounded-xl flex items-center justify-center text-xl group-hover:bg-red-100 group-hover:text-red-600 transition-colors">
                      👤
                    </div>
                    <div>
                      <p className="text-gray-900 font-bold">{empleado.nombre}</p>
                      <p className="text-gray-400 text-xs font-medium">{empleado.email}</p>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => onFire(empleado.id_usuario)}
                    className="px-4 py-2 bg-white border border-red-100 text-red-500 text-xs font-bold rounded-xl hover:bg-red-500 hover:text-white hover:border-red-500 transition-all shadow-sm active:scale-95"
                  >
                    Dar de Baja
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-gray-400 font-medium">No se han encontrado empleados activos.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 border-t border-gray-100 text-center">
          <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">
            Atención: Esta acción desactivará el acceso del usuario al sistema.
          </p>
        </div>
      </div>
    </div>
  );
};