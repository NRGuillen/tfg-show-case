import React, { useState } from "react";
import type { RegistroEmpleadoDTO } from "../types/employeeRegister";
import { validateDniNie, validateNSS } from "../utils/validations";

type ModalAltaEmployeeProps = {
    isOpen: boolean;
    onClose: () => void;
    onSave: (employee: RegistroEmpleadoDTO) => void;
    idPeluqueria: number; // Este lo pasamos desde el componente padre, lo sacamos del token del Jefe
}

type FormErrors = {
    dni_nie?: string;
    nss?: string;
};

export const ModalAltaEmployee = ({ isOpen, onClose, onSave, idPeluqueria }: ModalAltaEmployeeProps) => {
    const [formData, setFormData] = useState<RegistroEmpleadoDTO>({
        nombre: '',
        apellido_1: '',
        apellido_2: '',
        email: '',
        password: '',
        ubicacion: '',
        id_peluqueria: idPeluqueria,
        dni_nie: '',
        nss: ''
    });
    const [errors, setErrors] = useState<FormErrors>({});

    if (!isOpen) {
        return null;
    }

    const inputClass = (field: keyof FormErrors) =>
        `w-full border-2 p-2.5 rounded-xl outline-none transition-colors ${
            errors[field] ? 'border-red-500 focus:border-red-500' : 'border-gray-100 focus:border-blue-500'
        }`;

    // Funcion para actualizar el estado cuando se escribe
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        if (errors[name as keyof FormErrors]) {
            setErrors((prev) => ({ ...prev, [name]: undefined }));
        }
    };

    const validate = (): boolean => {
        const newErrors: FormErrors = {};
        if (!validateDniNie(formData.dni_nie)) {
            newErrors.dni_nie = 'DNI o NIE no válido (ej: 12345678Z o X1234567L)';
        }
        if (!validateNSS(formData.nss)) {
            newErrors.nss = 'Nº de Seguridad Social no válido (12 dígitos)';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Funcion para enviar los datos al componente padreee
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        onSave(formData);
    };

    return (
           <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[9999] p-4">
            <div className="bg-white p-8 rounded-2xl w-full max-w-2xl shadow-2xl relative overflow-y-auto max-h-[90vh]">
                
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-950 text-2xl">✕</button>

                <h2 className="text-2xl font-black text-gray-900 mb-6 border-b pb-4">Registrar Nuevo Empleado</h2>

                <form onSubmit={handleSubmit} className="space-y-5">
                    
                    {/* SECCIÓN 1: DATOS PERSONALES */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-1">
                            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Nombre</label>
                            <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} className="w-full border-2 border-gray-100 p-2.5 rounded-xl focus:border-blue-500 outline-none transition-colors" required />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">1º Apellido</label>
                            <input type="text" name="apellido_1" value={formData.apellido_1} onChange={handleChange} className="w-full border-2 border-gray-100 p-2.5 rounded-xl focus:border-blue-500 outline-none" required />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">2º Apellido</label>
                            <input type="text" name="apellido_2" value={formData.apellido_2} onChange={handleChange} className="w-full border-2 border-gray-100 p-2.5 rounded-xl focus:border-blue-500 outline-none" />
                        </div>
                    </div>

                    {/* SECCIÓN 2: CONTACTO Y ACCESO */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Email Corporativo</label>
                            <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full border-2 border-gray-100 p-2.5 rounded-xl focus:border-blue-500 outline-none" required />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Contraseña Temporal</label>
                            <input type="password" name="password" value={formData.password} onChange={handleChange} className="w-full border-2 border-gray-100 p-2.5 rounded-xl focus:border-blue-500 outline-none" required />
                        </div>
                    </div>

                    {/* SECCIÓN 3: DOCUMENTACIÓN */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">DNI / NIE (45879213P)</label>
                            <input
                                type="text"
                                name="dni_nie"
                                value={formData.dni_nie}
                                onChange={handleChange}
                                placeholder="Ej: 12345678Z"
                                className={inputClass('dni_nie')}
                                required
                            />
                            {errors.dni_nie && <p className="mt-1 text-xs text-red-500">{errors.dni_nie}</p>}
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Nº Seguridad Social (NSS)(414567891234)</label>
                            <input
                                type="text"
                                name="nss"
                                value={formData.nss}
                                onChange={handleChange}
                                placeholder="Ej: 281234567857"
                                className={inputClass('nss')}
                                required
                            />
                            {errors.nss && <p className="mt-1 text-xs text-red-500">{errors.nss}</p>}
                        </div>
                    </div>

                    {/* UBICACIÓN */}
                    <div>
                        <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Ciudad / Ubicación</label>
                        <input type="text" name="ubicacion" value={formData.ubicacion} onChange={handleChange} className="w-full border-2 border-gray-100 p-2.5 rounded-xl focus:border-blue-500 outline-none" placeholder="Ej: Madrid, España" />
                    </div>

                    {/* BOTONES DE ACCIÓN */}
                    <div className="flex gap-4 pt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all"
                        >
                            Finalizar Alta
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}