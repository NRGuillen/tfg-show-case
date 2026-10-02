import pool from '../database';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { FotoFavoritaUsuario, PhotoCard, PeluqueriaDetalle, PublicacionBusqueda, PublicacionPeluqueria } from '../types/photoCardType';

interface DBPhotoCardRow extends RowDataPacket {
    id_peluqueria: number;
    nombre_empresa: string;
    puntuacion: number;
    imagen: string;
    reviews: number;
    numero_seguidores: number;
    tipo_de_via: string;
    calle: string;
    codigo_postal: string;
}

interface DBPeluqueriaHorarioRow extends RowDataPacket {
    horario: string | null;
}

interface DBPublicacionRow extends RowDataPacket {
    id_publicacion: number;
    id_peluqueria: number;
    id_personal: number;
    imagen_url: string;
    nombre_empresa: string;
    nombre_trabajador: string;
}


interface DBFotoFavoritaRow extends RowDataPacket {
    id_favorita: number;
    id_peluqueria: number;
    id_personal: number;
    url: string;
    nombre_empresa: string;
    nombre_personal: string;
}


export const getPhotoCards = async (): Promise<PhotoCard[]> => {
    const query = `
        SELECT id_peluqueria, nombre_empresa, puntuacion, imagen, reviews, numero_seguidores, tipo_de_via, calle, codigo_postal
        FROM peluqueria
    `;

    const [rows] = await pool.query<DBPhotoCardRow[]>(query);

    return rows.map((row) => ({
        id: row.id_peluqueria,
        salon: row.nombre_empresa,
        rating: Number(row.puntuacion),
        image: row.imagen ?? '',
        reviews: Number(row.reviews ?? 0),
        numero_seguidores: Number(row.numero_seguidores ?? 0),
        tipo_de_via: row.tipo_de_via ?? '',
        calle: row.calle ?? '',
        codigo_postal: row.codigo_postal ?? ''
    }));
};

export const getPhotoCardDetailById = async (idPeluqueria: number): Promise<PeluqueriaDetalle | null> => {
    const query = `
        SELECT id_peluqueria, nombre_empresa, puntuacion, imagen, reviews, numero_seguidores, tipo_de_via, calle, codigo_postal
        FROM peluqueria
        WHERE id_peluqueria = ?
        LIMIT 1
    `;

    const [rows] = await pool.query<DBPhotoCardRow[]>(query, [idPeluqueria]);

    if (rows.length === 0) {
        return null;
    }

    const row = rows[0];

    return {
        id_peluqueria: Number(row.id_peluqueria),
        nombre_empresa: row.nombre_empresa,
        puntuacion: Number(row.puntuacion),
        imagen: row.imagen ?? '',
        reviews: Number(row.reviews ?? 0),
        numero_seguidores: Number(row.numero_seguidores ?? 0),
        tipo_de_via: row.tipo_de_via ?? '',
        calle: row.calle ?? '',
        codigo_postal: row.codigo_postal ?? ''
    };
};

export const addFavoriteStoreByUser = async (idUsuario: number, idPeluqueria: number): Promise<void> => {
    const query = `
        INSERT INTO usuario_peluqueria_favorita (id_usuario, id_peluqueria)
        VALUES (?, ?)
    `;

    await pool.execute(query, [idUsuario, idPeluqueria]);
};

export const removeFavoriteStoreByUser = async (idUsuario: number, idPeluqueria: number): Promise<void> => {
    const query = `
        DELETE FROM usuario_peluqueria_favorita
        WHERE id_usuario = ? AND id_peluqueria = ?
    `;

    await pool.execute(query, [idUsuario, idPeluqueria]);
};

interface DBFavoriteRow extends RowDataPacket {
    id_peluqueria: number;
}

export const getFavoriteStoreIdsByUser = async (idUsuario: number): Promise<number[]> => {
    const query = `
        SELECT id_peluqueria
        FROM usuario_peluqueria_favorita
        WHERE id_usuario = ?
    `;

    const [rows] = await pool.query<DBFavoriteRow[]>(query, [idUsuario]);
    return rows.map((row) => Number(row.id_peluqueria));
};

interface DBReservationByDateRow extends RowDataPacket {
    hora: string;
    id_personal: number | null;
}

export interface ReservationByDate {
    hora: string;
    idPersonal: number;
}

interface DBColumnRow extends RowDataPacket {
    COLUMN_NAME: string;
}

const schemaColumnCache = new Map<string, string | null>();

const getExistingColumn = async (tableName: string, candidates: string[]): Promise<string | null> => {
    const cacheKey = `${tableName}:${candidates.join('|')}`;
    if (schemaColumnCache.has(cacheKey)) {
        return schemaColumnCache.get(cacheKey) ?? null;
    }

    const placeholders = candidates.map(() => '?').join(', ');
    const query = `
        SELECT COLUMN_NAME
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = ?
          AND COLUMN_NAME IN (${placeholders})
        LIMIT 1
    `;

    const [rows] = await pool.query<DBColumnRow[]>(query, [tableName, ...candidates]);
    const columnName = rows[0]?.COLUMN_NAME ?? null;
    schemaColumnCache.set(cacheKey, columnName);
    return columnName;
};

// Validates that a column name is within the expected set before SQL interpolation
const validateColumn = (column: string | null, candidates: string[]): string | null => {
    if (column !== null && !candidates.includes(column)) {
        throw new Error(`Invalid column name "${column}". Allowed: ${candidates.join(', ')}`);
    }
    return column;
};

export const getReservedHoursByDate = async (idPeluqueria: number, fecha: string): Promise<ReservationByDate[]> => {
    const EMPLOYEE_COLS = ['id_personal_asignado', 'id_personal', 'id_empleado'];
    const HOUR_COLS = ['hora_reserva', 'hora'];
    const STATUS_COLS = ['estado', 'estado_reserva'];
    const employeeColumn = validateColumn(await getExistingColumn('reservas_peluqueria', EMPLOYEE_COLS), EMPLOYEE_COLS);
    const hourColumn = validateColumn(await getExistingColumn('reservas_peluqueria', HOUR_COLS), HOUR_COLS);
    const statusColumn = validateColumn(await getExistingColumn('reservas_peluqueria', STATUS_COLS), STATUS_COLS);
    const query = `
        SELECT ${hourColumn ? `DATE_FORMAT(${hourColumn}, '%H:%i')` : `DATE_FORMAT(fecha_reserva, '%H:%i')`} AS hora
        ${employeeColumn ? `, ${employeeColumn} AS id_personal` : ', NULL AS id_personal'}
        FROM reservas_peluqueria
        WHERE id_peluqueria = ?
          AND DATE(fecha_reserva) = ?
          ${statusColumn ? `AND UPPER(COALESCE(${statusColumn}, '')) <> 'CANCELADA'` : ''}
        ORDER BY fecha_reserva ASC
    `;

    const [rows] = await pool.query<DBReservationByDateRow[]>(query, [idPeluqueria, fecha]);
    return rows.map((row) => ({
        hora: row.hora,
        idPersonal: Number(row.id_personal ?? 0)
    }));
};

interface DBReservationExistsRow extends RowDataPacket {
    total: number;
}

export const userAlreadyReservedInStoreByDate = async (
    idPeluqueria: number,
    idUsuario: number,
    fecha: string
): Promise<boolean> => {
    const STATUS_COLS = ['estado', 'estado_reserva'];
    const statusColumn = validateColumn(await getExistingColumn('reservas_peluqueria', STATUS_COLS), STATUS_COLS);
    const query = `
        SELECT COUNT(*) AS total
        FROM reservas_peluqueria
        WHERE id_peluqueria = ?
          AND id_usuario = ?
          AND DATE(fecha_reserva) = ?
          ${statusColumn ? `AND UPPER(COALESCE(${statusColumn}, '')) <> 'CANCELADA'` : ''}
    `;

    const [rows] = await pool.query<DBReservationExistsRow[]>(query, [idPeluqueria, idUsuario, fecha]);
    return (rows[0]?.total ?? 0) > 0;
};

export const createReservationByUser = async (
    idPeluqueria: number,
    idUsuario: number,
    fecha: string,
    hora: string,
    idServicio: number,
    idPersonal: number,
    mensajeNotificacion: string
): Promise<boolean> => {
    const EMPLOYEE_COLS = ['id_personal_asignado', 'id_personal', 'id_empleado'];
    const SERVICE_COLS = ['id_servicio', 'id_tipo_servicio', 'servicio_id'];
    const HOUR_COLS = ['hora_reserva', 'hora'];
    const STATUS_COLS = ['estado', 'estado_reserva'];
    const employeeColumn = validateColumn(await getExistingColumn('reservas_peluqueria', EMPLOYEE_COLS), EMPLOYEE_COLS);
    const serviceColumn = validateColumn(await getExistingColumn('reservas_peluqueria', SERVICE_COLS), SERVICE_COLS);
    const hourColumn = validateColumn(await getExistingColumn('reservas_peluqueria', HOUR_COLS), HOUR_COLS);
    const statusColumn = validateColumn(await getExistingColumn('reservas_peluqueria', STATUS_COLS), STATUS_COLS);
    const fechaReserva = hourColumn ? fecha : `${fecha} ${hora}:00`;
    const hourValue = `${hora}:00`;

    const filterByEmployee = employeeColumn !== null && idPersonal > 0;

    const existsQuery = `
        SELECT COUNT(*) AS total
        FROM reservas_peluqueria
        WHERE id_peluqueria = ?
          AND DATE(fecha_reserva) = ?
          ${hourColumn ? `AND TIME(${hourColumn}) = TIME(?)` : 'AND TIME(fecha_reserva) = TIME(?)'}
          ${filterByEmployee ? `AND ${employeeColumn} = ?` : ''}
          ${statusColumn ? `AND UPPER(COALESCE(${statusColumn}, '')) <> 'CANCELADA'` : ''}
    `;

    const existsParams = filterByEmployee
        ? [idPeluqueria, fecha, hourValue, idPersonal]
        : [idPeluqueria, fecha, hourValue];
   
        const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const [existingRows] = await connection.query<DBReservationExistsRow[]>(existsQuery, existsParams);

        if (existingRows[0]?.total > 0) {
            await connection.rollback();
            return false;
        }

        const columns = ['id_peluqueria', 'id_usuario', 'fecha_reserva'];
        const values: Array<number | string> = [idPeluqueria, idUsuario, fechaReserva];

        if (hourColumn) {
            columns.push(hourColumn);
            values.push(hourValue);
        }

        if (serviceColumn) {
            columns.push(serviceColumn);
            values.push(idServicio);
        }

        if (filterByEmployee) {
            columns.push(employeeColumn!);
            values.push(idPersonal);
        }

        if (statusColumn) {
            columns.push(statusColumn);
            values.push('CONFIRMADA');
        }

        const insertQuery = `
            INSERT INTO reservas_peluqueria (${columns.join(', ')})
            VALUES (${columns.map(() => '?').join(', ')})
        `;

        await connection.execute<ResultSetHeader>(insertQuery, values);
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS notificaciones (
                id INT AUTO_INCREMENT PRIMARY KEY,
                mensaje VARCHAR(255) NOT NULL,
                fecha DATETIME NOT NULL,
                id_usuario INT NOT NULL
            )
        `);
        await connection.execute<ResultSetHeader>(
            `
                INSERT INTO notificaciones (mensaje, fecha, id_usuario)
                VALUES (?, ?, ?)
            `,
            [mensajeNotificacion, `${fecha} ${hora}:00`, idUsuario]
        );

        await connection.commit();
        return true;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

interface DBServicioRow extends RowDataPacket {
    id_servicio: number;
    nombre_servicio: string;
    precio: number;
}

export interface ServicioReserva {
    id_servicio: number;
    nombre_servicio: string;
    precio: number;
}

export const getServiciosByPeluqueria = async (idPeluqueria: number): Promise<ServicioReserva[]> => {
    const query = `
        SELECT id_servicio, nombre_servicio, precio
        FROM servicios
        WHERE id_peluqueria = ? AND CAST(activo AS UNSIGNED) = 1
        ORDER BY nombre_servicio ASC
    `;

    const [rows] = await pool.query<DBServicioRow[]>(query, [idPeluqueria]);
    return rows.map((row) => ({
        id_servicio: Number(row.id_servicio),
        nombre_servicio: row.nombre_servicio,
        precio: Number(row.precio)
    }));
};

interface DBEmpleadoRow extends RowDataPacket {
    id_personal: number;
    nombre: string;
}

export interface EmpleadoReserva {
    id_personal: number;
    nombre: string;
}

export const getEmpleadosByPeluqueria = async (idPeluqueria: number): Promise<EmpleadoReserva[]> => {
    const query = `
        SELECT personal.id_personal, t1.nombre
        FROM personal
        INNER JOIN usuario AS t1 ON t1.id_usuario = personal.id_usuario
        WHERE personal.id_peluqueria = ?
          AND personal.activo = 1
        ORDER BY t1.nombre ASC
    `;

    const [rows] = await pool.query<DBEmpleadoRow[]>(query, [idPeluqueria]);

    if (rows.length > 0) {
        return rows.map((row) => ({
            id_personal: Number(row.id_personal),
            nombre: row.nombre
        }));
    }

    interface DBDuenoRow extends RowDataPacket {
        id_personal: number;
        nombre: string;
    }

    const [fallbackRows] = await pool.query<DBDuenoRow[]>(
        `
            SELECT 0 AS id_personal, u.nombre
            FROM peluqueria AS p
            INNER JOIN usuario AS u ON u.id_usuario = p.id_dueno
            WHERE p.id_peluqueria = ?
            LIMIT 1
        `,
        [idPeluqueria]
    );

    return fallbackRows.map((row) => ({
        id_personal: 0,
        nombre: row.nombre
    }));
};

export const getHorarioByPeluqueria = async (idPeluqueria: number): Promise<string | null> => {
    const query = `
        SELECT horario
        FROM peluqueria
        WHERE id_peluqueria = ?
        LIMIT 1
    `;

    const [rows] = await pool.query<DBPeluqueriaHorarioRow[]>(query, [idPeluqueria]);
    return rows[0]?.horario ?? null;
};

export const followStoreByUser = async (idUsuario: number, idPeluqueria: number): Promise<number> => {
    const insertQuery = `
        INSERT INTO peluqueria_seguidores (id_usuario, id_peluqueria)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE id_usuario = VALUES(id_usuario)
    `;

    const [insertResult] = await pool.execute<ResultSetHeader>(insertQuery, [idUsuario, idPeluqueria]);

    if (insertResult.affectedRows === 1) {
        await pool.execute(
            `
                UPDATE peluqueria
                SET numero_seguidores = COALESCE(numero_seguidores, 0) + 1
                WHERE id_peluqueria = ?
            `,
            [idPeluqueria]
        );
    }

    const [rows] = await pool.query<RowDataPacket[]>(
        `
            SELECT numero_seguidores
            FROM peluqueria
            WHERE id_peluqueria = ?
            LIMIT 1
        `,
        [idPeluqueria]
    );

    return Number(rows[0]?.numero_seguidores ?? 0);
};

export const unfollowStoreByUser = async (idUsuario: number, idPeluqueria: number): Promise<number> => {
    const [deleteResult] = await pool.execute<ResultSetHeader>(
        `
            DELETE FROM peluqueria_seguidores
            WHERE id_usuario = ? AND id_peluqueria = ?
        `,
        [idUsuario, idPeluqueria]
    );

    if (deleteResult.affectedRows > 0) {
        await pool.execute(
            `
                UPDATE peluqueria
                SET numero_seguidores = GREATEST(COALESCE(numero_seguidores, 0) - 1, 0)
                WHERE id_peluqueria = ?
            `,
            [idPeluqueria]
        );
    }

    const [rows] = await pool.query<RowDataPacket[]>(
        `
            SELECT numero_seguidores
            FROM peluqueria
            WHERE id_peluqueria = ?
            LIMIT 1
        `,
        [idPeluqueria]
    );

    return Number(rows[0]?.numero_seguidores ?? 0);
};

export const getFollowStatusByUser = async (idUsuario: number, idPeluqueria: number): Promise<boolean> => {
    const [rows] = await pool.query<RowDataPacket[]>(
        `
            SELECT 1
            FROM peluqueria_seguidores
            WHERE id_usuario = ? AND id_peluqueria = ?
            LIMIT 1
        `,
        [idUsuario, idPeluqueria]
    );

    return rows.length > 0;
};

export const getPublicacionesByPeluqueria = async (idPeluqueria: number): Promise<PublicacionPeluqueria[]> => {
    const query = `
        SELECT
            p.id_publicacion,
            p.id_peluqueria,
            p.id_personal,
            p.imagen_url,
            TRIM(CONCAT_WS(' ', u.nombre, u.apellido_1, u.apellido_2)) AS nombre_trabajador
        FROM publicaciones AS p
        LEFT JOIN personal AS per ON per.id_personal = p.id_personal
        LEFT JOIN usuario AS u ON u.id_usuario = COALESCE(per.id_usuario, p.id_personal)
        WHERE p.id_peluqueria = ?
        ORDER BY fecha DESC, id_publicacion DESC
    `;

    const [rows] = await pool.query<DBPublicacionRow[]>(query, [idPeluqueria]);
    return rows.map((row) => ({
        id_publicacion: Number(row.id_publicacion),
        id_peluqueria: Number(row.id_peluqueria),
        id_personal: Number(row.id_personal ?? 0),
        imagen_url: row.imagen_url ?? '',
        nombre_trabajador: row.nombre_trabajador?.trim() || 'Trabajador'
    }));
};

export const addFavoritePhotoByUser = async (
    idUsuario: number,
    idPeluqueria: number,
    idPersonal: number,
    url: string
): Promise<boolean> => {
    const existsQuery = `
        SELECT 1
        FROM usuario_fotos_fav
        WHERE id_usuario = ?
          AND id_peluqueria = ?
          AND id_personal = ?
          AND url = ?
        LIMIT 1
    `;
    const [existingRows] = await pool.query<RowDataPacket[]>(existsQuery, [idUsuario, idPeluqueria, idPersonal, url]);

    if (existingRows.length > 0) {
        return false;
    }

    const query = `
        INSERT INTO usuario_fotos_fav (id_usuario, id_peluqueria, id_personal, url)
        VALUES (?, ?, ?, ?)
    `;

    await pool.execute(query, [idUsuario, idPeluqueria, idPersonal, url]);
    return true;
};

export const removeFavoritePhotoByUser = async (
    idUsuario: number,
    idPeluqueria: number,
    idPersonal: number,
    url: string
): Promise<boolean> => {
    const query = `
        DELETE FROM usuario_fotos_fav
        WHERE id_usuario = ?
          AND id_peluqueria = ?
          AND id_personal = ?
          AND url = ?
        LIMIT 1
    `;

    const [result] = await pool.execute<ResultSetHeader>(query, [idUsuario, idPeluqueria, idPersonal, url]);
    return result.affectedRows > 0;
};

export const getFavoritePhotosByUser = async (idUsuario: number): Promise<FotoFavoritaUsuario[]> => {
    const query = `
        SELECT
            fav.id,
            fav.id_peluqueria,
            fav.id_personal,
            fav.url,
            p.nombre_empresa,
            TRIM(CONCAT_WS(' ', u.nombre, u.apellido_1, u.apellido_2)) AS nombre_personal
        FROM usuario_fotos_fav AS fav
        LEFT JOIN peluqueria AS p ON p.id_peluqueria = fav.id_peluqueria
        LEFT JOIN personal AS per ON per.id_personal = fav.id_personal
        LEFT JOIN usuario AS u ON u.id_usuario = per.id_usuario
        WHERE fav.id_usuario = ?
        ORDER BY fav.id DESC
    `;

    const [rows] = await pool.query<DBFotoFavoritaRow[]>(query, [idUsuario]);
    return rows.map((row) => ({
        id_favorita: Number(row.id_favorita),
        id_peluqueria: Number(row.id_peluqueria),
        id_personal: Number(row.id_personal),
        url: row.url ?? '',
        nombre_empresa: row.nombre_empresa ?? 'Peluquería',
        nombre_personal: row.nombre_personal?.trim() || 'Trabajador'
    }));
};

interface DBNotificationRow extends RowDataPacket {
    id_notificacion: number;
    mensaje: string;
    fecha: string;
}

export interface NotificacionUsuario {
    id_notificacion: number;
    mensaje: string;
    fecha: string;
}

const ensureNotificationsTableExists = async () => {
    await pool.execute(`
        CREATE TABLE IF NOT EXISTS notificaciones (
            id INT AUTO_INCREMENT PRIMARY KEY,
            mensaje VARCHAR(255) NOT NULL,
            fecha DATETIME NOT NULL,
            id_usuario INT NOT NULL
        )
    `);
};

export const getNotificationsByUser = async (idUsuario: number): Promise<NotificacionUsuario[]> => {
    await ensureNotificationsTableExists();
    const NOTIF_ID_COLS = ['id', 'id_notificacion'];
    const notificationIdColumn = validateColumn(await getExistingColumn('notificaciones', NOTIF_ID_COLS), NOTIF_ID_COLS);

    if (!notificationIdColumn) {
        throw new Error('No se encontró una columna de identificador válida en notificaciones');
    }

   const [rows] = await pool.query<DBNotificationRow[]>(
        `
            SELECT
                ${notificationIdColumn} AS id_notificacion,
                mensaje,
                DATE_FORMAT(fecha, '%d/%m/%Y %H:%i') AS fecha
            FROM notificaciones
            WHERE id_usuario = ?
            ORDER BY fecha DESC, ${notificationIdColumn} DESC
        `,
        [idUsuario]
    );

    return rows.map((row) => ({
        id_notificacion: Number(row.id_notificacion),
        mensaje: row.mensaje,
        fecha: row.fecha
    }));
};

export const deleteNotificationByIdForUser = async (idNotificacion: number, idUsuario: number): Promise<boolean> => {
    await ensureNotificationsTableExists();
    const NOTIF_ID_COLS = ['id', 'id_notificacion'];
    const notificationIdColumn = validateColumn(await getExistingColumn('notificaciones', NOTIF_ID_COLS), NOTIF_ID_COLS);

    if (!notificationIdColumn) {
        throw new Error('No se encontró una columna de identificador válida en notificaciones');
    }

    const [result] = await pool.execute<ResultSetHeader>(
        `
            DELETE FROM notificaciones
            WHERE ${notificationIdColumn} = ? AND id_usuario = ?
        `,
        [idNotificacion, idUsuario]
    );

    return result.affectedRows > 0;
};


interface DBUserReviewExistsRow extends RowDataPacket {
    total: number;
}

export const createReviewByUser = async (
    idUsuario: number,
    idPeluqueria: number,
    estrellas: number,
    comentario: string
): Promise<{ created: boolean; puntuacion?: number; reviews?: number }> => {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const [existingRows] = await connection.query<DBUserReviewExistsRow[]>(
            `
                SELECT COUNT(*) AS total
                FROM usuario_resenas_peluqueria
                WHERE id_usuario = ? AND id_peluqueria = ?
            `,
            [idUsuario, idPeluqueria]
        );

        if ((existingRows[0]?.total ?? 0) > 0) {
            await connection.rollback();
            return { created: false };
        }

        await connection.execute(
            `
                INSERT INTO usuario_resenas_peluqueria (id_usuario, id_peluqueria, comentario, estrellas, fecha_creacion)
                VALUES (?, ?, ?, ?, NOW())
            `,
            [idUsuario, idPeluqueria, comentario, estrellas]
        );

        const [pelRows] = await connection.query<RowDataPacket[]>(
            `
                SELECT puntuacion, reviews
                FROM peluqueria
                WHERE id_peluqueria = ?
                LIMIT 1
                FOR UPDATE
            `,
            [idPeluqueria]
        );

        const puntuacionActual = Number(pelRows[0]?.puntuacion ?? 0);
        const reviewsActuales = Number(pelRows[0]?.reviews ?? 0);
        const nuevasReviews = reviewsActuales + 1;
        const nuevaPuntuacion = Number((((puntuacionActual * reviewsActuales) + estrellas) / nuevasReviews).toFixed(2));

        await connection.execute(
            `
                UPDATE peluqueria
                SET puntuacion = ?, reviews = ?
                WHERE id_peluqueria = ?
            `,
            [nuevaPuntuacion, nuevasReviews, idPeluqueria]
        );

        await connection.commit();
        return { created: true, puntuacion: nuevaPuntuacion, reviews: nuevasReviews };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

export const getRandomPublicaciones = async (): Promise<PublicacionBusqueda[]> => {
    const query = `
        SELECT
            p.id_publicacion,
            p.id_peluqueria,
            p.id_personal,
            p.imagen_url,
            pel.nombre_empresa,
            TRIM(CONCAT_WS(' ', u.nombre, u.apellido_1, u.apellido_2)) AS nombre_trabajador
        FROM publicaciones AS p
        INNER JOIN peluqueria AS pel ON pel.id_peluqueria = p.id_peluqueria
        LEFT JOIN personal AS per ON per.id_personal = p.id_personal
        LEFT JOIN usuario AS u ON u.id_usuario = COALESCE(per.id_usuario, p.id_personal)
        ORDER BY RAND()
    `;

    const [rows] = await pool.query<DBPublicacionRow[]>(query);
    return rows.map((row) => ({
        id_publicacion: Number(row.id_publicacion),
        id_peluqueria: Number(row.id_peluqueria),
        id_personal: Number(row.id_personal ?? 0),
        imagen_url: row.imagen_url ?? '',
        nombre_empresa: row.nombre_empresa ?? 'Peluquería',
        nombre_trabajador: row.nombre_trabajador?.trim() || 'Trabajador'
    }));
};