import { useState } from "react"
import type { CartItem, Producto } from "../types"
import { Link } from "react-router-dom"

type TiendaProps = {
    cart: CartItem[]
    removeFromCart: (id: Producto['id']) => void
    increaseQuantity: (id: Producto['id']) => void
    decreaseQuantity: (id: Producto['id']) => void
    clearCart: () => void
    onCheckout: () => void
    isEmpty: boolean
    cartTotal: number
    onToggleEliminar?: () => void
    onToggleEditar?: () => void
    onAbrirModal?: () => void
    isEliminarActive: boolean
    isEditarActive: boolean
    mostrarControlesGestion: boolean
}

export default function Tienda({
    cart,
    removeFromCart,
    increaseQuantity,
    decreaseQuantity,
    clearCart,
    onCheckout,
    isEmpty,
    cartTotal,
    onToggleEliminar,
    onToggleEditar,
    onAbrirModal,
    isEliminarActive,
    isEditarActive,
    mostrarControlesGestion
}: TiendaProps) {

    // Estado para controlar la visibilidad del carrito (Evita que se cierre solo)
    const [isCartVisible, setIsCartVisible] = useState(false);

    return (
        <header className="bg-white shadow-sm py-8">
            <div className="container mx-auto px-4">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">

                    <div className="w-full md:w-1/4 text-center md:text-left">
                        <h1 className="text-2xl font-black text-blue-600 uppercase tracking-tighter">
                            <Link
                                to="/inicio"
                                className="text-gray-800 hover:text-blue-600 transition-colors cursor-pointer"
                            >
                                ALTIORAM
                            </Link>

                            {mostrarControlesGestion && (
                                <span className="ml-2 text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full align-middle inline-block">
                                    MODO GESTIÓN
                                </span>
                            )}
                        </h1>
                    </div>

                    <nav className="flex items-center gap-8">
                        {mostrarControlesGestion ? (
                            /* --- BOTONES DE GESTIÓN --- */
                            <div className="fixed bottom-8 right-8 z-50 flex flex-col gap-2.5 items-end">
                                <button
                                    onClick={onAbrirModal}
                                    className="bg-blue-600 text-white w-48 px-5 py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg active:scale-95 flex items-center justify-start gap-3 border-2 border-white/20"
                                >
                                    <span className="text-xl w-6 text-center">➕</span>
                                    <span className="uppercase text-xs tracking-widest">Añadir</span>
                                </button>

                                <button
                                    onClick={onToggleEliminar}
                                    className={`${isEliminarActive ? 'bg-gray-950 scale-110' : 'bg-red-600 hover:bg-red-700'} text-white w-48 px-5 py-4 rounded-2xl font-bold transition-all shadow-lg active:scale-95 flex items-center justify-start gap-3 border-2 border-white/20`}
                                >
                                    <span className="text-xl w-6 text-center">{isEliminarActive ? '✓' : '🗑️'}</span>
                                    <span className="uppercase text-xs tracking-widest">
                                        {isEliminarActive ? 'Finalizar' : 'Eliminar'}
                                    </span>
                                </button>

                                <button
                                    onClick={onToggleEditar}
                                    className={`${isEditarActive ? 'bg-gray-950 scale-110' : 'bg-green-600 hover:bg-green-700'} text-white w-48 px-5 py-4 rounded-2xl font-bold transition-all shadow-lg active:scale-95 flex items-center justify-start gap-3 border-2 border-white/20`}
                                >
                                    <span className="text-xl w-6 text-center">{isEditarActive ? '✓' : '✏️'}</span>
                                    <span className="uppercase text-xs tracking-widest">
                                        {isEditarActive ? 'Finalizar' : 'Modificar'}
                                    </span>
                                </button>
                            </div>
                        ) : (
                            /* --- VISTA DEL CLIENTE (CARRITO) --- */
                            <div
                                className="relative"
                                onMouseEnter={() => setIsCartVisible(true)}
                                onMouseLeave={() => setIsCartVisible(false)}
                            >
                                <div
                                    className="cursor-pointer p-2 hover:bg-gray-100 rounded-full transition-colors relative"
                                    onClick={() => setIsCartVisible(!isCartVisible)}
                                >
                                    {/* NUEVA IMAGEN PERSONALIZADA */}
                                    <img
                                        src="/img/carritoColor.png"
                                        alt="Carrito"
                                        className="h-10 w-10 object-contain transition-transform group-hover:scale-110"
                                    />
                                    {!isEmpty && (
                                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full h-5 w-5 flex items-center justify-center font-bold shadow-md z-10">
                                            {cart.reduce((total, item) => total + item.quantity, 0)}
                                        </span>
                                    )}
                                </div>

                                {isCartVisible && (
                                    <div className="absolute right-0 top-full pt-2 z-50 w-80 md:w-96">
                                        <div className="bg-white p-6 shadow-2xl rounded-lg border border-gray-100 animate-in fade-in slide-in-from-top-2">
                                            <h3 className="text-lg font-bold mb-4 border-b pb-2">Tu Carrito</h3>

                                            {isEmpty ? (
                                                <p className="text-center text-gray-500 py-6">El carrito está vacío</p>
                                            ) : (
                                                <>
                                                    <div className="max-h-64 overflow-y-auto custom-scrollbar">
                                                        <table className="w-full text-left text-sm">
                                                            <thead className="text-gray-400 uppercase text-xs border-b">
                                                                <tr>
                                                                    <th className="pb-2">Producto</th>
                                                                    <th className="pb-2">Precio</th>
                                                                    <th className="pb-2 text-center">Cant.</th>
                                                                    <th className="pb-2"></th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-gray-100">
                                                                {cart.map(producto => (
                                                                    <tr key={producto.id}>
                                                                        <td className="py-3 font-medium text-gray-700">{producto.nombre}</td>
                                                                        <td className="py-3 text-gray-600">{producto.precio}€</td>
                                                                        <td className="py-3 text-center">
                                                                            <div className="flex items-center justify-center gap-2">
                                                                                <button
                                                                                    className="bg-gray-100 px-2 py-0.5 rounded hover:bg-gray-200"
                                                                                    onClick={() => decreaseQuantity(producto.id)}
                                                                                >-</button>
                                                                                <span className="w-4 font-bold">{producto.quantity}</span>
                                                                                <button
                                                                                    className="bg-gray-100 px-2 py-0.5 rounded hover:bg-gray-200"
                                                                                    onClick={() => increaseQuantity(producto.id)}
                                                                                >+</button>
                                                                            </div>
                                                                        </td>
                                                                        <td className="py-3 text-right">
                                                                            <button
                                                                                className="text-red-400 hover:text-red-600"
                                                                                onClick={() => removeFromCart(producto.id)}
                                                                            >✕</button>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>

                                                    <div className="mt-4 pt-4 border-t border-gray-200 text-right">
                                                        <p className="text-lg text-gray-600">Total: <span className="font-bold text-xl text-gray-900">{cartTotal}€</span></p>
                                                    </div>
                                                </>
                                            )}

                                            <button
                                                className="w-full mt-4 bg-blue-600 text-white py-3 rounded-md font-bold hover:bg-blue-700 transition-colors uppercase text-[10px] tracking-widest disabled:opacity-50"
                                                onClick={onCheckout}
                                                disabled={isEmpty}
                                            >
                                                Finalizar Compra
                                            </button>

                                            <button
                                                className="w-full mt-4 bg-gray-900 text-white py-3 rounded-md font-bold hover:bg-black transition-colors uppercase text-[10px] tracking-widest disabled:opacity-50"
                                                onClick={clearCart}
                                                disabled={isEmpty}
                                            >
                                                Vaciar Carrito
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </nav>
                </div>
            </div>
        </header>
    )
}