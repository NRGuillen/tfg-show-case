import { RowDataPacket } from 'mysql2';

//Ingresos menzuales
export type IngresoMensualRow = {
    name: string;  // Ejemplo: '2026-05'
    total: number; // Suma de servicios + tienda
} & RowDataPacket;

//Para los clientes en la grafica circular
export type FidelizacionRow = {
    name: string;  // 'Fieles (Recurrentes)' o 'Nuevos'
    value: number; // Cantidad de clientes
} & RowDataPacket;

// Rendimiento por mes
export type KPIRow = {
    ingresosMes: number;
    citasMes: number;
} & RowDataPacket;

// respuesta que envia el backend
export type AnalyticsResponse = {
    ok?: boolean;
    ingresos: IngresoMensualRow[];
    fidelizacion: FidelizacionRow[];
    kpis: KPIRow;
};