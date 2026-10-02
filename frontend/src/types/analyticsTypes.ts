
export type IngresoMensual = {
    name: string;  // Formato: 'YYYY-MM' (ej: '2026-05')
    total: number; // Suma de ingresos de ese mes
};


export type FidelizacionData = {
    name: string;  // 'Fieles (Recurrentes)' o 'Nuevos'
    value: number; // Cantidad de usuarios
};


export type KPIs = {
    ingresosMes: number;
    citasMes: number;
};


export type AnalyticsResponse = {
    ok: boolean;
    ingresos: IngresoMensual[];
    fidelizacion: FidelizacionData[];
    kpis: KPIs;
    msg?: string; // En caso de error
};