import { RowDataPacket } from 'mysql2';

// Para la consulta de la tabla personal
export type PersonalRow = RowDataPacket & {
    id_personal: number;
};

// Para la respuesta de Cloudinary
export type CloudinaryUploadResponse = {
    secure_url: string;
    public_id: string;
    [key: string]: any; // Permite otras propiedades opcionales de Cloudinary
};

// Tipo para el usuario que viene decodificado en el token
export type UsuarioPayload = {
    id: number;
    rol: string;
    idPeluqueria: number;
};