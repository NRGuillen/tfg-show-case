import pool from '../database';
import type{ 
    IngresoMensualRow, 
    FidelizacionRow, 
    KPIRow, 
    AnalyticsResponse 
} from '../types/analyticsTypes';

/**
 * Servicio para obtener métricas de negocio combinando datos de citas y ventas de la tienda.
 * @param idPeluqueria ID del negocio para filtrar los resultados.
 */
export const getStatsService = async (idPeluqueria: number): Promise<Omit<AnalyticsResponse, 'ok'>> => {
    
    // INGRESOS MENSUALES (Últimos 6 meses)
    // Combina la suma de servicios confirmados y ventas de productos en la tienda.
    const queryIngresos = `
        SELECT 
            meses.mes as name,
            CAST(COALESCE(SUM(serv.total_servicios), 0) + COALESCE(SUM(fact.total_tienda), 0) AS DECIMAL(10,2)) as total
        FROM (
            SELECT DATE_FORMAT(CURDATE(), '%Y-%m') as mes
            UNION SELECT DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), '%Y-%m')
            UNION SELECT DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 2 MONTH), '%Y-%m')
            UNION SELECT DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 3 MONTH), '%Y-%m')
            UNION SELECT DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 4 MONTH), '%Y-%m')
            UNION SELECT DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 5 MONTH), '%Y-%m')
        ) meses
        LEFT JOIN (
            SELECT DATE_FORMAT(fecha_reserva, '%Y-%m') as mes, SUM(s.precio) as total_servicios
            FROM reservas_peluqueria r
            JOIN servicios s ON r.id_servicio = s.id_servicio
            WHERE r.id_peluqueria = ? AND r.estado LIKE 'CONF%'
            GROUP BY mes
        ) serv ON meses.mes = serv.mes
        LEFT JOIN (
            SELECT DATE_FORMAT(fecha_emision, '%Y-%m') as mes, SUM(total_precio) as total_tienda
            FROM factura
            WHERE id_peluqueria = ?
            GROUP BY mes
        ) fact ON meses.mes = fact.mes
        GROUP BY meses.mes
        ORDER BY meses.mes ASC
    `;

    // FIDELIZACIÓN
    // Clasifica a los usuarios según cuántas citas confirmadas tienen en el histórico del negocio.
    const queryFidelizacion = `
        SELECT 
            CASE WHEN visitas > 1 THEN 'Fieles (Recurrentes)' ELSE 'Nuevos' END as name,
            COUNT(*) as value
        FROM (
            SELECT id_usuario, COUNT(*) as visitas
            FROM reservas_peluqueria
            WHERE id_peluqueria = ? AND estado LIKE 'CONF%'
            GROUP BY id_usuario
        ) as historial
        GROUP BY name
    `;

    // INDICADORES CLAVE (KPIs) DEL MES ACTUAL
    // Calcula ingresos totales (tienda + servicios) y volumen de citas del mes en curso.
    const queryKPIs = `
        SELECT 
            (
                (SELECT CAST(COALESCE(SUM(s.precio), 0) AS DECIMAL(10,2)) 
                 FROM reservas_peluqueria r 
                 JOIN servicios s ON r.id_servicio = s.id_servicio 
                 WHERE r.id_peluqueria = ? AND r.estado LIKE 'CONF%' 
                 AND MONTH(r.fecha_reserva) = MONTH(CURDATE()) AND YEAR(r.fecha_reserva) = YEAR(CURDATE()))
                +
                (SELECT CAST(COALESCE(SUM(total_precio), 0) AS DECIMAL(10,2)) 
                 FROM factura 
                 WHERE id_peluqueria = ? 
                 AND MONTH(fecha_emision) = MONTH(CURDATE()) AND YEAR(fecha_emision) = YEAR(CURDATE()))
            ) as ingresosMes,
            (SELECT COUNT(*) 
             FROM reservas_peluqueria 
             WHERE id_peluqueria = ? AND estado LIKE 'CONF%' 
             AND MONTH(fecha_reserva) = MONTH(CURDATE()) AND YEAR(fecha_reserva) = YEAR(CURDATE())
            ) as citasMes
    `;

    // Ejecución de las consultas con tipado estricto
    const [ingresos] = await pool.execute<IngresoMensualRow[]>(queryIngresos, [idPeluqueria, idPeluqueria]);
    const [fidelizacion] = await pool.execute<FidelizacionRow[]>(queryFidelizacion, [idPeluqueria]);
    const [kpiRows] = await pool.execute<KPIRow[]>(queryKPIs, [idPeluqueria, idPeluqueria, idPeluqueria]);

    // Devolvemos el primer resultado de KPIs (ya que la query siempre devuelve una fila)
    // Si no hay datos, inicializamos a cero para evitar errores en el frontend.
    const kpisPredeterminados: KPIRow = {
        ingresosMes: 0,
        citasMes: 0
    } as KPIRow;

    return {
        ingresos: ingresos || [],
        fidelizacion: fidelizacion || [],
        kpis: kpiRows[0] || { ingresosMes: 0, citasMes: 0 }
    };
};