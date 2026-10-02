import React, { useState, useEffect } from 'react';
import { validateLuhn } from '../utils/validations';
// Importamos el tipo desde tu nuevo archivo
import type { DatosEnvio } from '../types/checkoutTypes';

type ModalPagoProps = {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (datosEnvio: DatosEnvio) => Promise<void>;
    total: number;
    usuario: any; // Aquí podrías usar tu tipo 'Usuario' si lo tienes
};

export const ModalPago = ({ isOpen, onClose, onConfirm, total, usuario }: ModalPagoProps) => {
    const [formData, setFormData] = useState<DatosEnvio>({
        email: '',
        direccion: '',
        numeroTarjeta: ''
    });

    const [errorTarjeta, setErrorTarjeta] = useState(false);
    const [loading, setLoading] = useState(false);

    // Autocompletado de datos cuando el usuario logueado abre el modal
    useEffect(() => {
        if (usuario) {
            setFormData(prev => ({
                ...prev,
                email: usuario.email || '',
                direccion: usuario.ubicacion || '' // Mapeo de 'ubicacion' a 'direccion'
            }));
        }
    }, [usuario]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // 1. Validación de tarjeta (Luhn)
        if (!validateLuhn(formData.numeroTarjeta)) {
            setErrorTarjeta(true);
            return;
        }

        setErrorTarjeta(false);
        setLoading(true);

        try {
            // 2. Ejecutar la función de confirmación (el checkout)
            await onConfirm(formData);
        } catch (error) {
            console.error("Error al procesar el pago:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 overflow-y-auto max-h-[90vh]">
                <div className="flex justify-between items-center border-b pb-3 mb-4">
                    <h2 className="text-xl font-bold text-gray-800">Finalizar Compra</h2>
                    <button 
                        onClick={onClose} 
                        className="text-gray-500 hover:text-gray-700 text-2xl"
                    >
                        &times;
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email de contacto</label>
                        <input
                            type="email"
                            required
                            className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Dirección de envío</label>
                        <input
                            type="text"
                            required
                            className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                            value={formData.direccion}
                            onChange={e => setFormData({ ...formData, direccion: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Número de Tarjeta (Prueba: 49927398716)</label>
                        <input
                            type="text"
                            required
                            placeholder="0000000000000000"
                            className={`mt-1 block w-full border rounded-md p-2 shadow-sm outline-none ${
                                errorTarjeta ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300 focus:ring-indigo-500'
                            }`}
                            value={formData.numeroTarjeta}
                            onChange={e => setFormData({ ...formData, numeroTarjeta: e.target.value })}
                        />
                        {errorTarjeta && (
                            <p className="text-red-500 text-xs mt-1">El número de tarjeta no es válido (Luhn).</p>
                        )}
                    </div>

                    <div className="pt-4 border-t border-gray-100">
                        <div className="flex justify-between text-lg font-bold mb-4">
                            <span>Total a pagar:</span>
                            <span className="text-indigo-600">{total}€</span>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-3 px-4 rounded-md text-white font-bold transition-colors ${
                                loading ? 'bg-gray-400' : 'bg-indigo-600 hover:bg-indigo-700'
                            }`}
                        >
                            {loading ? 'Procesando...' : 'Confirmar y Pagar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};