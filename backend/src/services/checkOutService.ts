import pool from '../database';
import { ResultSetHeader } from 'mysql2';
import { CartItem } from '../types/productType';

export const createCheckout = async (idUsuario: number, items: CartItem[]): Promise<number[]> => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Agrupar por peluquería
        const grupos = items.reduce((acc, item) => {
            if (!acc[item.id_peluqueria]) acc[item.id_peluqueria] = [];
            acc[item.id_peluqueria].push(item);
            return acc;
        }, {} as Record<number, CartItem[]>);

        const facturasIds: number[] = [];

        // 2. Crear una factura por cada grupo
        for (const [idPeluqueria, productos] of Object.entries(grupos)) {
            const total = productos.reduce((sum, i) => sum + (i.precio * i.quantity), 0);

            const [facturaRes] = await connection.query<ResultSetHeader>(
                'INSERT INTO factura (id_usuario, id_peluqueria, fecha_emision, total_precio) VALUES (?, ?, NOW(), ?)',
                [idUsuario, Number(idPeluqueria), total]
            );
            
            const idFactura = facturaRes.insertId;
            facturasIds.push(idFactura);

            for (const item of productos) {
                // Insertar en la nueva tabla detalles_factura
                await connection.query(
                    'INSERT INTO detalles_factura (id_factura, id_producto, cantidad, precio_unitario, subtotal) VALUES (?, ?, ?, ?, ?)',
                    [idFactura, item.id, item.quantity, item.precio, item.precio * item.quantity]
                );
                // Descontar stock
                await connection.query(
                    'UPDATE tienda_negocio SET stock_actual = stock_actual - ? WHERE id_producto = ? AND id_peluqueria = ?',
                    [item.quantity, item.id, item.id_peluqueria]
                );
            }
        }
        await connection.commit();
        return facturasIds;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};