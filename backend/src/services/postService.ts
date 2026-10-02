import cloudinary from '../config/cloudinary';
import pool from '../database';
import { ResultSetHeader } from 'mysql2';
import { PersonalRow, CloudinaryUploadResponse } from '../types/crearPostType';

export const crearPublicacionService = async (
    idPeluqueria: number,
    idUsuario: number,
    descripcion: string,
    buffer: Buffer
): Promise<number> => {
    
    //  Busca el id_personal en la tabla personal
    const [personalRows] = await pool.execute<PersonalRow[]>(
        'SELECT id_personal FROM personal WHERE id_usuario = ? AND id_peluqueria = ? LIMIT 1',
        [idUsuario, idPeluqueria]
    );

    const idPersonalReal: number | null = personalRows.length > 0 ? personalRows[0].id_personal : null;

    // Subida a Cloudinary con tipado
    const uploadResult = await new Promise<CloudinaryUploadResponse>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder: 'cortes_altioram' },
            (error, result) => {
                if (error || !result) reject(error);
                else resolve(result as CloudinaryUploadResponse);
            }
        );
        stream.end(buffer);
    });

    // Insert en la tabla publicaciones
    const query = `
        INSERT INTO publicaciones (imagen_url, n_likes, descripcion, fecha, id_peluqueria, id_personal)
        VALUES (?, 0, ?, CURDATE(), ?, ?)
    `;

    const [result] = await pool.execute<ResultSetHeader>(query, [
        uploadResult.secure_url,
        descripcion || null,
        idPeluqueria,
        idPersonalReal
    ]);

    return result.insertId;
};

export const obtenerPublicacionesPeluqueria = async (idPeluqueria: number): Promise<any[]> => {
    const query = `
        SELECT id_publicacion, imagen_url, descripcion, fecha, n_likes 
        FROM publicaciones 
        WHERE id_peluqueria = ? 
        ORDER BY fecha DESC, id_publicacion DESC
    `;
    const [rows] = await pool.execute(query, [idPeluqueria]);
    return rows as any[];
};