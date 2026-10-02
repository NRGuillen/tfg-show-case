

// Usamos 'type' con intersección de RowDataPacket para que sea compatible con mysql2
export type DBReserva = {
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

export type UsuarioBusqueda = {
    id_usuario: number;
    nombre: string;
    apellido_1: string;
};

export type Reserva = {
    id_reserva: number;
    id_usuario: number;      // <--- Añade esto
    nombre_cliente: string;
    hora_reserva: string;    // Formato "10:30"
    fecha_reserva?: string; // hora y fecha completo
    estado: string;
    notas?: string;          // <--- Añade esto
};