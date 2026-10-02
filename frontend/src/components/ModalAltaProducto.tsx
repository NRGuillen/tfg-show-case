import { useState, useRef } from 'react';
import type { CreateProductDTO } from '../types';

type ModalAltaProps = {
    onClose: () => void;
    // Modificamos onSave para recibir el archivo opcionalmente
    onSave: (producto: CreateProductDTO, imagenFile?: File) => void;
}

export default function ModalAltaProducto({ onClose, onSave }: ModalAltaProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [imagenFile, setImagenFile] = useState<File | undefined>(undefined);

    const [formData, setFormData] = useState<CreateProductDTO>({
        nombre: '',
        descripcion: '',
        imagen_url: '', // Se mantendrá vacío si subimos archivo
        sku_universal: '',
        precio_local: 0,
        stock_actual: 0,
        stock_minimo: 0
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: name.includes('precio') || name.includes('stock') ? Number(value) : value
        });
    };

    // Manejador del archivo (Igual que en Publicaciones)
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImagenFile(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Pasamos los datos y el archivo al onSave
        onSave(formData, imagenFile);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up">
                
                {/* Cabecera */}
                <div className="bg-blue-600 p-6 text-white flex justify-between items-center">
                    <h2 className="text-xl font-bold uppercase tracking-wider">Nuevo Producto</h2>
                    <button onClick={onClose} className="hover:rotate-90 transition-transform text-2xl">&times;</button>
                </div>

                {/* Formulario */}
                <form onSubmit={handleSubmit} className="p-8 space-y-4 max-h-[80vh] overflow-y-auto">
                    
                    {/* SECCIÓN DE IMAGEN (NUEVA) */}
                    <div className="space-y-2">
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Imagen del Producto</label>
                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="relative group border-2 border-dashed border-gray-200 rounded-2xl h-44 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all overflow-hidden"
                        >
                            {preview ? (
                                <img src={preview} alt="Preview" className="h-full w-full object-cover" />
                            ) : (
                                <div className="text-center">
                                    <span className="text-4xl">📸</span>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase mt-2">Haga clic para subir fotografía</p>
                                </div>
                            )}
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                onChange={handleFileChange} 
                                className="hidden" 
                                accept="image/*" 
                            />
                            {preview && (
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-bold uppercase">
                                    Cambiar Foto
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-xs font-black text-gray-400 uppercase mb-1">Nombre del Producto</label>
                            <input required name="nombre" value={formData.nombre} onChange={handleChange} className="w-full bg-gray-50 border-none rounded-xl p-3 focus:ring-2 focus:ring-blue-500" placeholder="Ej: Champú Hidratante" />
                        </div>

                        <div className="col-span-2">
                            <label className="block text-xs font-black text-gray-400 uppercase mb-1">SKU Universal</label>
                            <input required name="sku_universal" value={formData.sku_universal} onChange={handleChange} className="w-full bg-gray-50 border-none rounded-xl p-3 focus:ring-2 focus:ring-blue-500" placeholder="Código de barras o referencia" />
                        </div>

                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase mb-1">Precio (€)</label>
                            <input required type="number" step="0.01" name="precio_local" value={formData.precio_local} onChange={handleChange} className="w-full bg-gray-50 border-none rounded-xl p-3 focus:ring-2 focus:ring-blue-500" />
                        </div>

                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase mb-1">Stock Actual</label>
                            <input required type="number" name="stock_actual" value={formData.stock_actual} onChange={handleChange} className="w-full bg-gray-50 border-none rounded-xl p-3 focus:ring-2 focus:ring-blue-500" />
                        </div>
                        
                        <div className="col-span-2">
                            <label className="block text-xs font-black text-gray-400 uppercase mb-1">Descripción</label>
                            <textarea required name="descripcion" value={formData.descripcion} onChange={handleChange} className="w-full bg-gray-50 border-none rounded-xl p-3 focus:ring-2 focus:ring-blue-500 resize-none" rows={3} placeholder="Descripción del producto..." />
                        </div>
                    </div>

                    <div className="pt-6 flex gap-3">
                        <button type="button" onClick={onClose} className="flex-1 py-3 font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors">
                            Cancelar
                        </button>
                        <button type="submit" className="flex-1 py-3 font-bold bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 transition-all active:scale-95">
                            Guardar Producto
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}