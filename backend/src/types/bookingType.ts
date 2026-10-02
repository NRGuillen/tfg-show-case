import { RowDataPacket } from 'mysql2';

// Usamos 'type' con intersección de RowDataPacket para que sea compatible con mysql2
export type DBReserva = RowDataPacket & {
    id_reserva: number;
    id_peluqueria: number;
    id_usuario: number;
    fecha_reserva: string | Date;
    id_personal_asignado: number | null;
    id_servicio: number;
    estado: 'CONFIRMADA' | 'PENDIENTE' | 'CANCELADA';
    // Campos opcionales que vienen de los JOIN
    nombre_cliente?: string;
    hora_reserva?: string;
};

// Type para los datos de entrada (Data Transfer Object)
export type ForzarCitaDTO = {
    id_usuario: number;
    id_peluqueria: number;
    id_personal_asignado: number | null;
    fecha_reserva: string; // Formato "YYYY-MM-DD HH:mm:ss"
    id_servicio: number;
    notas?: string;
};

export type UsuarioBusqueda = RowDataPacket & {
    id_usuario: number;
    nombre: string;
    apellido_1: string;
};
export type DBServicioRow = RowDataPacket & {
    id_servicio: number;
    nombre_servicio: string;
    precio: number;
    id_peluqueria: number;
};

