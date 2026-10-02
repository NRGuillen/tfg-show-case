import { useState } from 'react';
import type { Producto, CreateProductDTO } from '../types';

type ModalEditarProps = {
    product: Producto;
    onClose: () => void;
    onSave: (id: number, datos: CreateProductDTO) => Promise<void>;
};

export default function ModalEditarProducto({ product, onClose, onSave }: ModalEditarProps) {
    // 1. Estado para los datos del formulario
    const [formData, setFormData] = useState<CreateProductDTO>({
        nombre: product.nombre,
        descripcion: product.descripcion,
        imagen_url: product.imagen_url,
        sku_universal: product.sku_universal || '', 
        precio_local: product.precio,
        stock_actual: product.stock_actual,
        stock_minimo: 1
    });

    // 2. Estado para el feedback visual (Paso 3)
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true); // Bloqueamos el botón

        try {
            await onSave(product.id, formData);
            onClose();
        } catch (error) {
            console.error(error);
            alert("Error al guardar los cambios");
        } finally {
            setIsSubmitting(false); // Liberamos el botón pase lo que pase
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
                {/* Cabecera */}
                <div className="bg-green-600 p-6 text-white flex justify-between items-center">
                    <h2 className="text-xl font-black uppercase">Editar Producto</h2>
                    <button onClick={onClose} className="hover:rotate-90 transition-transform text-2xl">✕</button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-4">

                    {/* Fila: Precio y Stock */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Precio (€)</label>
                            <input 
                                type="number" 
                                required
                                className="w-full border-b-2 border-gray-100 focus:border-green-500 outline-none py-2"
                                value={formData.precio_local}
                                onChange={e => setFormData({...formData, precio_local: Number(e.target.value)})}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Stock</label>
                            <input 
                                type="number" 
                                required
                                className="w-full border-b-2 border-gray-100 focus:border-green-500 outline-none py-2"
                                value={formData.stock_actual}
                                onChange={e => setFormData({...formData, stock_actual: Number(e.target.value)})}
                            />
                        </div>
                    </div>

                    {/* Descripción */}
                    <div>
                        <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Descripción</label>
                        <textarea 
                            className="w-full border-b-2 border-gray-100 focus:border-green-500 outline-none py-2 transition-colors resize-none"
                            rows={2}
                            value={formData.descripcion}
                            onChange={e => setFormData({...formData, descripcion: e.target.value})}
                        />
                    </div>

                    {/* URL Imagen */}
                    <div>
                        <label className="block text-xs font-bold uppercase text-gray-400 mb-1">URL Imagen</label>
                        <input 
                            type="text" 
                            className="w-full border-b-2 border-gray-100 focus:border-green-500 outline-none py-2 text-sm"
                            value={formData.imagen_url}
                            onChange={e => setFormData({...formData, imagen_url: e.target.value})}
                        />
                    </div>

                    {/* Botón Guardar con Feedback Visual */}
                    <button 
                        type="submit" 
                        disabled={isSubmitting}
                        className={`w-full font-bold py-4 rounded-2xl shadow-lg transition-all active:scale-95 uppercase tracking-widest mt-4 ${
                            isSubmitting 
                                ? 'bg-gray-400 cursor-not-allowed text-gray-200' 
                                : 'bg-green-600 hover:bg-green-700 text-white'
                        }`}
                    >
                        {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                </form>
            </div>
        </div>
    );
}