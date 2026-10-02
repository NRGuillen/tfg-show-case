import { useState } from 'react' 
import { useParams } from 'react-router-dom'
import Tienda from '../components/Tienda'
import Product from '../components/Product'
import { useCart } from '../hooks/useCart'
import { useInventory } from '../hooks/useInventory'
import ModalAltaProducto from '../components/ModalAltaProducto'
import { ModalPago } from '../components/modalPago'
import { useAuthContext } from '../hooks/useAuthContext'
import type { Producto } from '../types'
import type { DatosEnvio } from '../types/checkoutTypes'

export default function ShopPage() {
    const params = useParams();
    const { usuario } = useAuthContext();

    // ESTADO PARA EL MODAL DE PAGO
    const [isPagoModalOpen, setIsPagoModalOpen] = useState(false);

    const idUrl = params.idPeluqueria || params.id;
    const idPeluqueriaFinal = idUrl ? Number(idUrl) : Number(usuario?.idPeluqueria);

    const esGestion = (usuario?.rol === 'DUEÑO' || usuario?.rol === 'PERSONAL') &&
        Number(usuario?.idPeluqueria) === idPeluqueriaFinal;

    const {
        data,
        setData,
        cart,
        addToCart: addToCartHook,
        removeFromCart,
        increaseQuantity,
        decreaseQuantity,
        clearCart,
        isEmpty,
        cartTotal,
        checkout
    } = useCart(idPeluqueriaFinal);

    const addToCart = (product: Producto) => {
        addToCartHook(product, idPeluqueriaFinal);
    };

    const handleOpenPago = () => {
        const token = sessionStorage.getItem('token');
        if (!token) {
            alert("Debes iniciar sesión para realizar la compra.");
            return;
        }
        // Abrimos modal Pago
        setIsPagoModalOpen(true);
    };

    // FUNCIÓN QUE SE EJECUTA CUANDO EL MODAL PAGA DE VERDAD
    const handleConfirmarPago = async (datos: DatosEnvio) => {
        await checkout(datos.email, datos.direccion);
        setIsPagoModalOpen(false);
    };

    const {
        modoEliminar, modoEditar, isModalOpen, toggleModoEliminar,
        toggleModoEditar, abrirModalAlta, cerrarModalAlta,
        eliminarProducto, añadirProducto, editarProducto
    } = useInventory(setData, idPeluqueriaFinal);

    return (
        <div className="min-h-screen bg-gray-50">
            <Tienda
                cart={cart}
                removeFromCart={(id) => removeFromCart(id, idPeluqueriaFinal)}
                increaseQuantity={(id) => increaseQuantity(id, idPeluqueriaFinal)}
                decreaseQuantity={(id) => decreaseQuantity(id, idPeluqueriaFinal)}
                clearCart={clearCart}
                onCheckout={handleOpenPago} // Ahora abre el modal
                isEmpty={isEmpty}
                cartTotal={cartTotal}
                // ... resto de props ...
                onToggleEliminar={esGestion ? toggleModoEliminar : undefined}
                onToggleEditar={esGestion ? toggleModoEditar : undefined}
                onAbrirModal={esGestion ? abrirModalAlta : undefined}
                isEliminarActive={modoEliminar}
                isEditarActive={modoEditar}
                mostrarControlesGestion={esGestion}
            />

            <main className="container mx-auto mt-10 px-4 pb-20">
                <h2 className="text-4xl font-black text-center uppercase my-12 text-gray-800 tracking-tighter">
                    Catálogo de Productos
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {Array.isArray(data) && data.length > 0 ? (
                        data.map((product) => (
                            <Product
                                key={product.id}
                                product={product}
                                addToCart={(item) => addToCart(item)}
                                modoEliminar={modoEliminar}
                                modoEditar={modoEditar}
                                onEliminar={eliminarProducto}
                                onEditar={editarProducto}
                            />
                        ))
                    ) : (
                        <div className="col-span-full py-20 text-center text-gray-400">
                            Esta peluquería aún no tiene productos.
                        </div>
                    )}
                </div>
            </main>

            {/* MODAL DE ALTA DE PRODUCTOS */}
            {isModalOpen && (
                <ModalAltaProducto
                    onClose={cerrarModalAlta}
                    onSave={añadirProducto}
                />
            )}

            {/* MODAL PAGO*/}
            <ModalPago
                isOpen={isPagoModalOpen}
                onClose={() => setIsPagoModalOpen(false)}
                onConfirm={handleConfirmarPago}
                total={cartTotal}
                usuario={usuario} // Le pasamos el usuario del context para el email y ubicación
            />
        </div>
    )
}