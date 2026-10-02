import { useState, useEffect } from 'react';
import { ModalAltaEmployee } from './ModalAltaEmployee';
import { ModalBajaEmployee } from './ModalBajaEmployee'; // Crearemos este ahora
import { useAuthContext } from '../hooks/useAuthContext';
import type { RegistroEmpleadoDTO } from '../types/employeeRegister';

export const GestionContratacion = () => {
    const [isAltaModalOpen, setIsAltaModalOpen] = useState(false);
    const [isBajaModalOpen, setIsBajaModalOpen] = useState(false);
    const [staff, setStaff] = useState<any[]>([]); // Estado para la lista de empleados

    const { usuario } = useAuthContext();
    const idPeluqueriaJefe = usuario?.idPeluqueria || 0;
    const apiURL = import.meta.env.VITE_API_URL;
    const token = sessionStorage.getItem('token');

    /**
     * Carga los empleados de la peluquería
     */
    const fetchStaff = async () => {
        try {
            const response = await fetch(`${apiURL}/api/userJ/staff/${idPeluqueriaJefe}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (response.ok) setStaff(data);
        } catch (error) {
            console.error("Error cargando empleados:", error);
        }
    };

    // Cargamos la lista cuando se abre el modal de bajas o cambia la peluquería
    useEffect(() => {
        if (idPeluqueriaJefe) fetchStaff();
    }, [idPeluqueriaJefe]);

    /**
     * Lógica para contratar
     */
    const handleSaveEmployee = async (nuevoEmpleado: RegistroEmpleadoDTO) => {
        try {
            const response = await fetch(`${apiURL}/api/userJ/hire`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(nuevoEmpleado)
            });

            if (response.ok) {
                alert("¡Empleado registrado con éxito!");
                setIsAltaModalOpen(false);
                fetchStaff(); // Recargamos la lista
            } else {
                const data = await response.json();
                alert(`Error: ${data.message || 'No se pudo registrar'}`);
            }
        } catch (error) {
            alert("Error de conexión con el servidor.");
        }
    };

    /**
     * Lógica para despedir (Borrado lógico)
     */
    const handleFireEmployee = async (id: number) => {
        const confirmar = window.confirm("¿Estás seguro de dar de baja a este empleado?");
        if (!confirmar) return;

        try {
            const response = await fetch(`${apiURL}/api/userJ/fire/${id}`, {
                method: 'PUT', // Usamos PUT para el borrado lógico
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                alert("Empleado dado de baja correctamente.");
                // Actualizamos el estado local para que desaparezca
                setStaff(prev => prev.filter(emp => emp.id_usuario !== id));
            }
        } catch (error) {
            alert("Error al procesar la baja.");
        }
    };

    return (
        <div className="p-6">
            <header className="mb-10">
                <h1 className="text-4xl font-black text-gray-950 tracking-tight">
                    Gestión de Personal
                </h1>
                <p className="text-gray-500 font-medium text-lg mt-2">
                    Panel administrativo para la gestión de tu equipo.
                </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl">
                {/* BOTÓN: DAR DE ALTA */}
                <button
                    onClick={() => setIsAltaModalOpen(true)}
                    className="group border-2 border-dashed border-blue-200 p-12 rounded-[2rem] flex flex-col items-center justify-center bg-white hover:bg-blue-50 hover:border-blue-400 transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-blue-100"
                >
                    <div className="h-20 w-20 bg-blue-100 text-blue-600 rounded-3xl flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition-transform duration-300">
                        ➕
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Dar de Alta</h2>
                    <p className="text-gray-500 text-sm mt-3 text-center">Registra un nuevo estilista.</p>
                </button>

                {/* BOTÓN: DAR DE BAJA */}
                <button
                    onClick={() => setIsBajaModalOpen(true)}
                    className="group border-2 border-dashed border-red-100 p-12 rounded-[2rem] flex flex-col items-center justify-center bg-white hover:bg-red-50 hover:border-red-300 transition-all duration-300 shadow-sm"
                >
                    <div className="h-20 w-20 bg-red-100 text-red-600 rounded-3xl flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition-transform duration-300">
                        ➖
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Dar de Baja</h2>
                    <p className="text-gray-500 text-sm mt-3 text-center">Gestionar ceses de actividad.</p>
                </button>
            </div>

            {/* Modal de Alta */}
            {isAltaModalOpen && (
                <ModalAltaEmployee
                    isOpen={isAltaModalOpen}
                    onClose={() => setIsAltaModalOpen(false)}
                    onSave={handleSaveEmployee}
                    idPeluqueria={idPeluqueriaJefe}
                />
            )}

            {/* Modal de Baja */}
            {isBajaModalOpen && (
                <ModalBajaEmployee
                    isOpen={isBajaModalOpen}
                    onClose={() => setIsBajaModalOpen(false)}
                    staff={staff}
                    onFire={handleFireEmployee}
                />
            )}
        </div>
    );
};