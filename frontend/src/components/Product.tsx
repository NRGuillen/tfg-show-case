import { useState } from 'react' // !!! Importamos useState
import type { Producto, CreateProductDTO } from '../types'
import { useAuthContext } from '../hooks/useAuthContext'
import ModalEditarProducto from './ModalEditarProducto' // !!! Importamos el nuevo componente

type ProductProps = {
    product: Producto,
    addToCart: (item: Producto) => void,
    modoEliminar: boolean
    modoEditar: boolean
    onEliminar: (id: Producto['id']) => void
    onEditar: (idProducto: number, datosEditados: CreateProductDTO) => Promise<void>;
}

export default function Product({
    product,
    addToCart,
    modoEliminar,
    modoEditar,
    onEliminar,
    onEditar
}: ProductProps) {
    const { usuario } = useAuthContext();
    
    // !!! ESTADO PARA CONTROLAR EL MODAL DE ESTA TARJETA
    const [isEditingThis, setIsEditingThis] = useState(false);

    const { id, nombre, precio, descripcion, stock_actual, imagen_url } = product

    return (
        <> {/* !!! ENVOLVEMOS EN UN FRAGMENTO */}
            <div className="relative bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between h-full group overflow-hidden">

                {/* 1. CAPA VISUAL DE ELIMINACIÓN */}
                {modoEliminar && (
                    <div
                        onClick={() => onEliminar(id)}
                        className="absolute inset-0 z-50 bg-red-600/20 backdrop-blur-[2px] flex flex-col items-center justify-center cursor-pointer hover:bg-red-600/40 transition-all group/del"
                    >
                        <div className="bg-white p-4 rounded-full shadow-2xl transform group-hover/del:scale-125 transition-transform duration-300">
                            <span className="text-3xl">🗑️</span>
                        </div>
                        <p className="text-white font-black mt-2 drop-shadow-md uppercase text-sm">Eliminar</p>
                    </div>
                )}

                {/* 2. CAPA VISUAL DE EDICIÓN MODIFICADA */}
                {modoEditar && (
                    <div
                        onClick={() => setIsEditingThis(true)} // !!! CAMBIADO: Ahora abre el modal
                        className="absolute inset-0 z-50 bg-green-600/20 backdrop-blur-[2px] flex flex-col items-center justify-center cursor-pointer hover:bg-green-600/40 transition-all group/edit"
                    >
                        <div className="bg-white p-4 rounded-full shadow-2xl transform group-hover/edit:scale-125 transition-transform duration-300">
                            <span className="text-3xl">✏️</span>
                        </div>
                        <p className="text-white font-black mt-2 drop-shadow-md uppercase text-sm">Editar</p>
                    </div>
                )}

                {/* Imagen del Producto */}
                <div className="bg-gray-50 rounded-xl h-48 mb-4 flex items-center justify-center overflow-hidden">
                    <img
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        src={imagen_url}
                        alt={nombre}
                    />
                </div>

                <div className="flex flex-col grow">
                    <h3 className="text-gray-900 font-bold text-lg uppercase tracking-tight mb-1">
                        {nombre}
                    </h3>

                    <p className="text-gray-500 text-sm line-clamp-2 mb-3">
                        {descripcion}
                    </p>

                    <div className="flex justify-between items-end mb-4">
                        <p className="text-blue-600 font-black text-2xl">
                            {precio}€
                        </p>

                        <p className={`text-xs font-bold px-2 py-1 rounded-lg ${stock_actual > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {stock_actual > 0 ? `Stock: ${stock_actual}` : 'Sin Stock'}
                        </p>
                    </div>

                    {/* LÓGICA DE BOTONES INFERIORES */}
                    {usuario?.rol !== 'DUEÑO' && usuario?.rol !== 'PERSONAL' ? (
                        <button
                            type="button"
                            disabled={stock_actual <= 0}
                            className={`mt-auto w-full py-3 rounded-xl font-semibold transition-colors shadow-lg active:scale-95 ${stock_actual > 0
                                    ? 'bg-gray-900 text-white hover:bg-blue-600'
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                }`}
                            onClick={() => addToCart(product)}
                        >
                            {stock_actual > 0 ? 'Agregar al Carrito' : 'Agotado'}
                        </button>
                    ) : (
                        <div className="mt-auto text-center py-2 bg-blue-50 text-blue-700 rounded-xl text-xs font-bold border border-blue-100">
                            {modoEliminar || modoEditar ? 'Acción Requerida Arriba' : 'Producto Gestionable'}
                        </div>
                    )}
                </div>
            </div>

            {/* !!! RENDERIZAMOS EL MODAL FUERA DE LA TARJETA PERO DENTRO DEL FRAGMENTO */}
            {isEditingThis && (
                <ModalEditarProducto 
                    product={product}
                    onClose={() => setIsEditingThis(false)}
                    onSave={onEditar}
                />
            )}
        </>
    )
}