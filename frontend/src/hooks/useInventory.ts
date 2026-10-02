import { useState, useEffect } from 'react';
import type { Producto, CreateProductDTO } from '../types';
import { useAuthContext } from './useAuthContext';

type SetDataProducts = React.Dispatch<React.SetStateAction<Producto[]>>;

export const useInventory = (setData?: SetDataProducts, idPeluqueria?: number) => {
    const { token, usuario } = useAuthContext();

    const [modoEliminar, setModoEliminar] = useState(false);
    const [modoEditar, setModoEditar] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        if (!idPeluqueria || !setData) return;

        const fetchProductos = async () => {
            try {
                const apiURL = import.meta.env.VITE_API_URL;
                const response = await fetch(`${apiURL}/api/productos/tienda/${idPeluqueria}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    setData(data);
                }
            } catch (error) {
                console.error("Error cargando inventario inicial:", error);
            }
        };

        fetchProductos();
    }, [idPeluqueria, setData, token]);

    const toggleModoEliminar = () => {
        setModoEliminar(!modoEliminar);
        setModoEditar(false);
    };

    const toggleModoEditar = () => {
        setModoEditar(!modoEditar);
        setModoEliminar(false);
    };

    const abrirModalAlta = () => setIsModalOpen(true);
    const cerrarModalAlta = () => setIsModalOpen(false);

    const eliminarProducto = async (idProducto: Producto['id']) => {
        if (!window.confirm('¿Estás seguro de que deseas eliminar este producto de tu tienda?')) return;

        try {
            const apiURL = import.meta.env.VITE_API_URL;
            const response = await fetch(`${apiURL}/api/productos/${idProducto}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                if (setData) {
                    setData(prev => prev.filter(p => p.id !== idProducto));
                }
                alert("¡Producto eliminado con éxito!");
            } else {
                const errorData = await response.json();
                alert(`Error: ${errorData.message || 'No se pudo eliminar'}`);
            }
        } catch (error) {
            console.error("Error de conexión:", error);
            alert("No se pudo conectar con el servidor.");
        }
    };

    // --- MODIFICACIÓN AQUÍ: Acepta imagenFile ---
    const añadirProducto = async (nuevoProducto: CreateProductDTO, imagenFile?: File) => {
        try {
            const apiURL = import.meta.env.VITE_API_URL;

            // 1. Creamos FormData para enviar archivos y texto
            const formData = new FormData();

            // 2. Agregamos la imagen con la clave 'imagen' (como espera Multer)
            if (imagenFile) {
                formData.append('imagen', imagenFile);
            }

            // 3. Agregamos los datos del producto
            formData.append('nombre', nuevoProducto.nombre);
            formData.append('descripcion', nuevoProducto.descripcion);
            formData.append('sku_universal', nuevoProducto.sku_universal);
            formData.append('precio_local', String(nuevoProducto.precio_local));
            formData.append('stock_actual', String(nuevoProducto.stock_actual));
            formData.append('stock_minimo', String(nuevoProducto.stock_minimo));

            // Enviamos el ID de la peluquería si es necesario
            if (usuario?.idPeluqueria) {
                formData.append('id_peluqueria', String(usuario.idPeluqueria));
            }

            const response = await fetch(`${apiURL}/api/productos`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                    // NOTA: El navegador pone el Content-Type automáticamente para FormData
                },
                body: formData
            });

            if (response.ok) {
                const respuestaServidor = await response.json();

                // El servidor te devuelve el objeto ya procesado con su ID y URL de imagen real
                // Si tu controlador devuelve { id: 1, nombre: '...', imagen_url: '...' }, úsalo directamente.

                const productoLlego = respuestaServidor.producto || respuestaServidor;

                if (setData) {
                    setData(prev => {
                        // 1. Evitamos duplicados (el error de las keys que vimos antes)
                        const existe = prev.some(p => p.id === productoLlego.id);
                        if (existe) return prev;

                        // 2. Mapeamos para que las propiedades se llamen como el componente espera
                        // Revisa si tu componente usa 'precio' o 'precio_local'
                        const nuevoProductoFormateado: Producto = {
                            id: productoLlego.id,
                            nombre: productoLlego.nombre,
                            descripcion: productoLlego.descripcion,
                            imagen_url: productoLlego.imagen_url, // URL final de Cloudinary
                            precio: productoLlego.precio_local || productoLlego.precio,
                            stock_actual: productoLlego.stock_actual,
                            venta_publico: 1
                        };

                        return [...prev, nuevoProductoFormateado];
                    });
                }

                cerrarModalAlta();
                alert("¡Producto añadido con éxito!");
            } else {
                const error = await response.json();
                alert(`Error del servidor: ${error.message || 'Error desconocido'}`);
            }
        } catch (error) {
            console.error("Error al añadir producto:", error);
            alert("Error de conexión al intentar guardar.");
        }
    };

    const editarProducto = async (idProducto: number, datosEditados: CreateProductDTO) => {
        try {
            const apiURL = import.meta.env.VITE_API_URL;
            const response = await fetch(`${apiURL}/api/productos/${idProducto}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(datosEditados)
            });

            if (response.ok) {
                const productoActualizado = await response.json();

                if (setData) {
                    setData(prev => prev.map(p =>
                        p.id === idProducto ? productoActualizado : p
                    ));
                }

                setModoEditar(false);
                alert("¡Producto actualizado correctamente!");
            } else {
                const error = await response.json();
                alert(`Error al editar: ${error.msg || 'Error desconocido'}`);
            }
        } catch (error) {
            console.error("Error en la petición de edición:", error);
            alert("Error de conexión al intentar editar.");
        }
    };

    return {
        modoEliminar,
        modoEditar,
        isModalOpen,
        toggleModoEliminar,
        toggleModoEditar,
        abrirModalAlta,
        cerrarModalAlta,
        eliminarProducto,
        añadirProducto,
        editarProducto
    };
};