import { useState, useEffect, useMemo } from 'react'
import type { Producto, CartItem } from '../types'

export const useCart = (idPeluqueria?: number) => {

    const initialCart = (): CartItem[] => {
        const localStorageCart = localStorage.getItem('cart')
        return localStorageCart ? JSON.parse(localStorageCart) : []
    }

    const [cart, setCart] = useState<CartItem[]>(initialCart)
    const [data, setData] = useState<Producto[]>([])

    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(cart))
    }, [cart])

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const apiURL = import.meta.env.VITE_API_URL
                const token = sessionStorage.getItem('token')
                const url = idPeluqueria
                    ? `${apiURL}/api/productos/tienda/${idPeluqueria}`
                    : `${apiURL}/api/productos`;

                const response = await fetch(url, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
                const result = await response.json()
                if (response.ok && Array.isArray(result)) setData(result)
            } catch (error) {
                console.error("Error cargando productos:", error)
            }
        }
        fetchProducts()
    }, [idPeluqueria])

    const MAX_ITEMS = 5
    const MIN_ITEMS = 1

    function addToCart(item: Producto, id_peluqueria: number) {
        setCart((prevCart) => {
            const itemExistIndex = prevCart.findIndex((i) =>
                i.id === item.id && i.id_peluqueria === id_peluqueria
            );

            if (itemExistIndex >= 0) {
                const updatedCart = [...prevCart];
                if (updatedCart[itemExistIndex].quantity < MAX_ITEMS) {
                    updatedCart[itemExistIndex].quantity++;
                }
                return updatedCart;
            } else {
                return [...prevCart, { ...item, quantity: 1, id_peluqueria }];
            }
        });
    }

    function removeFromCart(id: number, id_peluqueria: number) {
        setCart(prev => prev.filter(i => !(i.id === id && i.id_peluqueria === id_peluqueria)));
    }

    function increaseQuantity(id: number, id_peluqueria: number) {
        setCart(prev => prev.map(item =>
            (item.id === id && item.id_peluqueria === id_peluqueria && item.quantity < MAX_ITEMS)
                ? { ...item, quantity: item.quantity + 1 } : item
        ));
    }

    function decreaseQuantity(id: number, id_peluqueria: number) {
        setCart(prev => prev.map(item =>
            (item.id === id && item.id_peluqueria === id_peluqueria && item.quantity > MIN_ITEMS)
                ? { ...item, quantity: item.quantity - 1 } : item
        ));
    }

    const checkout = async (emailContacto?: string, direccion?: string) => {
        const apiURL = import.meta.env.VITE_API_URL;
        const token = sessionStorage.getItem('token');

        try {
            const response = await fetch(`${apiURL}/api/checkout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                //Incluimos los nuevos campos en el JSON que enviamos al backend
                body: JSON.stringify({
                    items: cart,
                    emailContacto, // Se envía d3lucasx@gmail.com
                    direccion      // Se envía la dirección del modal
                })
            });

            const result = await response.json();

            if (response.ok) {
                alert("¡Compra realizada con éxito! Revisa tu correo.");
                setCart([]);
                localStorage.removeItem('cart');
            } else {
                alert(`Error: ${result.msg}`);
            }
        } catch (error) {
            console.error("Error en el checkout:", error);
            alert("Hubo un problema al procesar el pedido.");
        }
    };
    const cartTotal = useMemo(() =>
        cart.reduce((total, item) => total + (item.quantity * item.precio), 0),
        [cart])

    return {
        data,
        setData,         
        cart,
        addToCart,
        removeFromCart,
        increaseQuantity,
        decreaseQuantity,
        clearCart: () => setCart([]),
        isEmpty: cart.length === 0,
        cartTotal,
        checkout         
    }
}
