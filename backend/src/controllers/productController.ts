import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { getStoreProducts, deleteProductFromStore, createOrAddProductToStore, updateProductInStore } from '../services/productService';

export const getProducts = async (req: AuthRequest, res: Response) => {
    try {
        // 1. PRIORIDAD: Miramos si el ID viene en los parámetros de la URL (/tienda/:idPeluqueria)
        // 2. SECUNDARIO: Si no hay parámetros, miramos el token del usuario (dueño en su panel)
        const idParam = req.params.idPeluqueria;
        const idPeluqueria = idParam ? Number(idParam) : req.usuario?.idPeluqueria;

        // Si después de mirar ambos sitios no hay ID, entonces sí devolvemos vacío
        if (!idPeluqueria) {
            console.log("⚠️ No se encontró idPeluqueria ni en URL ni en Token");
            return res.status(200).json([]);
        }

        const productos = await getStoreProducts(Number(idPeluqueria));

        // Limpiamos el objeto por si hay referencias circulares antes de enviar
        res.json(JSON.parse(JSON.stringify(productos)));

    } catch (error) {
        console.error("❌ Error en el controlador de productos:", error);
        res.status(500).json({ msg: 'Error al obtener productos', error });
    }
};

// --- FUNCIÓN PARA ELIMINAR ---
export const eliminarProducto = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const idPeluqueria = req.usuario?.idPeluqueria;

        if (!idPeluqueria) {
            return res.status(403).json({ ok: false, msg: 'No tienes permiso (falta ID Peluquería)' });
        }

        const resultado = await deleteProductFromStore(Number(id), idPeluqueria);

        if (resultado) {
            res.json({ ok: true, message: 'Producto eliminado correctamente' });
        } else {
            res.status(404).json({ ok: false, message: 'Producto no encontrado o no pertenece a tu tienda' });
        }
    } catch (error) {
        console.error("❌ Error al eliminar producto:", error);
        res.status(500).json({ ok: false, message: 'Error interno del servidor' });
    }
};

// --- FUNCIÓN PARA Añadir ---
export const agregarProducto = async (req: AuthRequest, res: Response) => {
    try {
        const idPeluqueria = req.usuario?.idPeluqueria;

        const {
            nombre,
            descripcion,
            sku_universal,
            precio_local,
            stock_actual,
            stock_minimo
        } = req.body;

        const archivo = req.file;

        // 1. Validación básica de entrada
        if (!idPeluqueria) {
            return res.status(401).json({ msg: 'No autorizado' });
        }

        if (!nombre || !sku_universal) {
            return res.status(400).json({ msg: 'El nombre y el SKU son obligatorios' });
        }

        // 2. Preparación de datos
        const productoData = {
            nombre,
            descripcion: descripcion || '', // Evita undefined si el campo está vacío
            sku_universal,
            precio_local: Number(precio_local) || 0,
            stock_actual: Number(stock_actual) || 0,
            stock_minimo: Number(stock_minimo) || 0,
            imagen_url: '' 
        };

        // 3. Llamada al servicio
        const resultado = await createOrAddProductToStore(
            productoData,
            Number(idPeluqueria),
            archivo?.buffer
        );

        // 4. Respuesta exitosa
        return res.status(201).json({
            ok: true,
            msg: 'Producto gestionado correctamente',
            producto: resultado
        });

    } catch (error) {
        console.error("❌ Error al añadir producto:", error);
        return res.status(500).json({ 
            ok: false, 
            msg: 'Hubo un error al procesar el producto' 
        });
    }
};

// --- FUNCIÓN PARA MODIFICAR ---
export const modificarProducto = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const idPeluqueria = req.usuario?.idPeluqueria;
        const productoData = req.body;

        if (!idPeluqueria) {
            return res.status(401).json({ ok: false, msg: 'No autorizado' });
        }

        const resultado = await updateProductInStore(Number(id), idPeluqueria, productoData);

        if (resultado) {
            res.json(resultado);
        } else {
            res.status(404).json({ ok: false, msg: 'No se pudo encontrar el producto para editar' });
        }
    } catch (error) {
        console.error("❌ Error al modificar producto:", error);
        res.status(500).json({ ok: false, msg: 'Error interno del servidor' });
    }
};

