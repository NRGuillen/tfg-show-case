import pool from '../database';
import { Producto, CreateProductDTO } from '../types/productType';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import cloudinary from '../config/cloudinary';

interface DBProductoRow extends RowDataPacket {
    id_producto: number;
    nombre: string;
    descripcion: string;
    imagen_url: string;
    sku_universal: string;
    precio: number;
    stock_actual: number;
    venta_publico: number;
}

export const getStoreProducts = async (idPeluqueria: number): Promise<Producto[]> => {
    try {
        const query = `
            SELECT 
                p.id_producto, p.nombre, tn.descripcion, p.imagen_url, p.sku_universal, 
                tn.precio_local AS precio, tn.stock_actual, tn.venta_publico
            FROM productos p 
            INNER JOIN tienda_negocio tn ON p.id_producto = tn.id_producto 
            WHERE tn.id_peluqueria = ? AND tn.disponibilidad = 1
        `;

        // Forzamos que idPeluqueria sea un número por si llega como string
        const [rows] = await pool.query<DBProductoRow[]>(query, [Number(idPeluqueria)]);
        
        return rows.map(row => ({
            id: row.id_producto,
            nombre: row.nombre,
            descripcion: row.descripcion,
            imagen_url: row.imagen_url,
            sku_universal: row.sku_universal,
            stock_actual: row.stock_actual,
            precio: Number(row.precio),
            venta_publico: row.venta_publico
        }));
    } catch (error) {
        console.error("❌ Error en getStoreProducts:", error);
        throw error;
    }
};
export const deleteProductFromStore = async (idProducto: number, idPeluqueria: number): Promise<boolean> => {
    try {
        // Borramos la relación en la tabla intermedia tienda_negocio
        // Esto hace que el producto deje de aparecer en esa peluquería específica
        const query = `
            DELETE FROM tienda_negocio 
            WHERE id_producto = ? AND id_peluqueria = ?
        `;

        const [result] = await pool.query<ResultSetHeader>(query, [idProducto, idPeluqueria]);

        return result.affectedRows > 0;
    } catch (error) {
        console.error("❌ Error en deleteProductFromStore Service:", error);
        throw error;
    }
};

export const createOrAddProductToStore = async (
    productoData: CreateProductDTO, 
    idPeluqueria: number,
    imageBuffer?: Buffer
) => {
    let finalImageUrl = productoData.imagen_url;

    // 1. Subida a Cloudinary (Fuera de la transacción para no bloquear la DB)
    if (imageBuffer) {
        const uploadResult = await new Promise<any>((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                { folder: 'productos_altioram' },
                (error, result) => {
                    if (error || !result) reject(error);
                    else resolve(result);
                }
            );
            stream.end(imageBuffer);
        });
        finalImageUrl = uploadResult.secure_url;
    }

    // 2. Iniciar Transacción
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // Comprobamos si existe el producto por SKU
        const [existing] = await connection.query<RowDataPacket[]>(
            'SELECT id_producto FROM productos WHERE sku_universal = ?',
            [productoData.sku_universal]
        );

        let idProducto: number;

        if (existing.length > 0) {
            idProducto = existing[0].id_producto;
            
            // OPCIONAL: Podrías actualizar la imagen_url aquí si el producto ya existe 
            // pero quieres que la nueva foto sea la que mandas ahora.
        } else {
            const [result] = await connection.query<ResultSetHeader>(
                'INSERT INTO productos (nombre, imagen_url, sku_universal) VALUES (?, ?, ?)',
                [productoData.nombre, finalImageUrl, productoData.sku_universal]
            );
            idProducto = result.insertId;
        }

        // 3. Insertamos en tienda_negocio
        await connection.query<ResultSetHeader>(
            `INSERT INTO tienda_negocio 
            (id_producto, id_peluqueria, descripcion, precio_local, stock_actual, stock_minimo, disponibilidad, venta_publico) 
            VALUES (?,?,?,?,?,?,?,?)`,
            [
                idProducto, 
                idPeluqueria, 
                productoData.descripcion, 
                productoData.precio_local, 
                productoData.stock_actual, 
                productoData.stock_minimo, 
                1, 
                1
            ]
        );

        // Si todo fue bien, confirmamos los cambios
        await connection.commit();

        return {
            id: idProducto,
            nombre: productoData.nombre,
            descripcion: productoData.descripcion,
            imagen_url: finalImageUrl,
            sku_universal: productoData.sku_universal,
            precio: productoData.precio_local,
            stock_actual: productoData.stock_actual,
            venta_publico: 1
        };

    } catch (error) {
        // Si algo falla, deshacemos todo lo hecho en la DB
        await connection.rollback();
        throw error;
    } finally {
        // Siempre liberamos la conexión
        connection.release();
    }
};

// Función que modifica un producto de la tienda si el usuario es un dueño de negocio.
export const updateProductInStore = async (idProducto: number, idPeluqueria: number, productoData: CreateProductDTO): Promise<Producto> => {
    // 1. Obtenemos una conexión específica del pool para la transacción
    const connection = await pool.getConnection();

    try {
        // ACTUALIZAMOS SOLO LA TABLA DE LA TIENDA
        // Ya no tocamos la tabla 'productos' ni usamos Transacciones
        await pool.query(
            'UPDATE tienda_negocio SET descripcion = ?, precio_local = ?, stock_actual = ?, stock_minimo = ? WHERE id_producto = ? AND id_peluqueria = ?',
            [productoData.descripcion, productoData.precio_local, productoData.stock_actual, productoData.stock_minimo, idProducto, idPeluqueria]
        );

        return {
            id: idProducto,
            nombre: productoData.nombre, 
            descripcion: productoData.descripcion,
            imagen_url: productoData.imagen_url,
            sku_universal: productoData.sku_universal,
            precio: Number(productoData.precio_local),
            stock_actual: productoData.stock_actual,
            venta_publico: 1
        };

    } catch (error) {
        // 7. Si algo falla, deshacemos cualquier cambio hecho en el try
        await connection.rollback();
        console.error("❌ Error en updateProductInStore (Transaction):", error);
        throw error;
    } finally {
        // 8. IMPORTANTE: Siempre liberar la conexión para que otros puedan usarla
        connection.release();
    }
};

