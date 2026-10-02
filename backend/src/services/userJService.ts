import pool from '../database';
import { ResultSetHeader } from 'mysql2'; // Importamos el tipo específico
import { PerfilUserJefe } from '../types/perfilUsuarioJefe';
import { RegistroEmpleadoDTO } from '../types/employeeRegister';
import { DBReserva, ForzarCitaDTO, UsuarioBusqueda, DBServicioRow } from '../types/bookingType';
import { RowDataPacket } from 'mysql2';
import bcrypt from 'bcryptjs';

// Definimos la interfaz exacta de lo que devuelve tu tabla 'usuario'
// Esto evita errores al usar los resultados de la query
interface DBUsuarioRow extends RowDataPacket {
    id_usuario: number;
    nombre: string;
    apellido_1: string;
    apellido_2: string;
    email: string;
    rol: string;
    ubicacion: string;
    imagenPerfil: string;
    imagenCabecera: string;
}

export const getUserJById = async (id: number): Promise<PerfilUserJefe | null> => {
    try {
        const query = 'SELECT id_usuario, nombre, apellido_1, apellido_2, email, rol, ubicacion, imagenPerfil, imagenCabecera FROM usuario WHERE id_usuario = ?';

        const [rows] = await pool.query<DBUsuarioRow[]>(query, [id]);

        // Si la base de datos no devuelve nada, retornamos null
        if (rows.length === 0) {
            return null;
        }

        const row = rows[0];

        // Transformamos los nombres de la DB a los nombres que espera tu Frontend
        return {
            id: row.id_usuario,
            nombre: row.nombre,
            apellido1: row.apellido_1,
            apellido2: row.apellido_2,
            email: row.email,
            rol: row.rol,
            ubicacion: row.ubicacion,
            imagenPerfil: row.imagenPerfil,
            imagenCabecera: row.imagenCabecera
        };

    } catch (error) {
        console.error("❌ Error en el Service getUserJById:", error);
        // Lanzamos el error para que el controlador lo capture en su bloque catch
        throw new Error("Error al consultar la base de datos");
    }
};


export const getPeluqueriaByDuenoId = async (idDueno: number): Promise<number | null> => {
    try {
        // Ejecutamos la consulta para buscar la peluquería de este dueño
        const [rows]: any = await pool.query(
            'SELECT id_peluqueria FROM peluqueria WHERE id_dueno = ?',
            [idDueno]
        );

        // Si existe, devolvemos el ID; si no, null
        return rows.length > 0 ? rows[0].id_peluqueria : null;

    } catch (error) {
        // Si hay un error de conexión o sintaxis, lo logueamos
        console.error("❌ Error en getPeluqueriaByDuenoId:", error);
        // Lanzamos el error para que el controlador lo maneje si es necesario
        throw new Error("Error al consultar la peluquería del dueño");
    }
};


//Funcion para hacer un insert de un nuevo empleado.
export const hireEmployee = async (datos: RegistroEmpleadoDTO): Promise<void> => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const [dniRows] = await connection.query<RowDataPacket[]>(
            'SELECT id_personal FROM personal WHERE dni_nie = ? LIMIT 1',
            [datos.dni_nie]
        );
        if (dniRows.length > 0) {
            await connection.rollback();
            const err: any = new Error('El DNI/NIE ya está registrado en la base de datos');
            err.code = 'DUPLICATE_DNI';
            throw err;
        }

        const [nssRows] = await connection.query<RowDataPacket[]>(
            'SELECT id_personal FROM personal WHERE nss = ? LIMIT 1',
            [datos.nss]
        );
        if (nssRows.length > 0) {
            await connection.rollback();
            const err: any = new Error('El NSS ya está registrado en la base de datos');
            err.code = 'DUPLICATE_NSS';
            throw err;
        }

        //Encriptar la contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(datos.password, salt);

        // insertar en la tabla usuarios usando la contrasseña encriptada
        const [result] = await connection.execute<ResultSetHeader>(
            `INSERT INTO usuario (nombre, apellido_1, apellido_2, email, password, rol, ubicacion, warnings, activo) 
       VALUES (?, ?, ?, ?, ?, 'PERSONAL', ?, 0, 1)`,
            [
                datos.nombre,      // 1
                datos.apellido_1,  // 2
                datos.apellido_2 || null, // 3
                datos.email,       // 4
                hashedPassword,    // 5
                datos.ubicacion || null // 6
            ]
        );

        // cogemos el Id que acabamos de insertar en la tabla usuarios para insertarla en la tablla personal
        const idEmpleadoNuevo = result.insertId;

        //  Insertamos en la tabla Personal
        await connection.execute(
            `INSERT INTO personal (id_usuario, id_peluqueria, dni_nie, nss, tipo_personal) 
            VALUES (?, ?, ?, ?, 'Empleado')`,
            [idEmpleadoNuevo, datos.id_peluqueria, datos.dni_nie, datos.nss]
        );

        await connection.commit();
        console.log('Empleado registrado con éxito!'); // Si todo va bien, confirmamos la transacción

    } catch (error) {
        await connection.rollback(); // Si algo falla, deshacemos todo para no dejar la base de datos a medias
        console.error("Error en el registro:", error);
        throw error; // Lanzamos el error para que el controlador lo capture y responda con un error 500
    } finally {
        connection.release(); // Liberamos la conexión del pool para que otros procesos puedan usarla
    }
};

/**
 * Funcion para devolver un array de empleados de una
 * peluquería
 * @param idPeluqueria 
 * @returns 
 */
/**
 * Obtiene los empleados ACTIVOS de una peluquería específica
 */
export const getStaff = async (idPeluqueria: number): Promise<any[]> => {
    const query = `
        SELECT u.id_usuario, u.nombre, u.email, u.rol 
        FROM usuario u
        INNER JOIN personal p ON u.id_usuario = p.id_usuario
        WHERE p.id_peluqueria = ? 
          AND u.rol = 'PERSONAL' 
          AND u.activo = 1
    `;
    const [rows] = await pool.query(query, [idPeluqueria]);
    return rows as any[];
};

/**
 * Realiza un borrado lógico de un empleado (activo = 0)
 * tanto en la tabla usuario como en personal.
 */
export const fireEmployee = async (idUsuario: number): Promise<void> => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // Desactivación de usuario en la tabla usuario
        const [resUser] = await connection.execute<ResultSetHeader>(
            'UPDATE usuario SET activo = 0 WHERE id_usuario = ? AND rol = "PERSONAL"',
            [idUsuario]
        );

        if (resUser.affectedRows === 0) {
            throw new Error('Empleado no encontrado en la tabla de usuarios');
        }

        // Desactivación del usuario en la tabla personal
        await connection.execute(
            'UPDATE personal SET activo = 0 WHERE id_usuario = ?',
            [idUsuario]
        );

        await connection.commit();
        console.log(`✅ Empleado ${idUsuario} desactivado (borrado lógico) con éxito.`);

    } catch (error) {
        if (connection) await connection.rollback();
        console.error("❌ Error en fireEmployee:", error);
        throw error; // Re-lanzamos para que el controlador informe al cliente
    } finally {
        if (connection) connection.release();
    }
};

export const getAgendaService = async (idUsuario: number, rol: string, idPeluqueria: number, fecha: string) => {
    // Obtenemos el horario de la peluquería
    const [pelu]: any = await pool.execute(
        'SELECT horario FROM peluqueria WHERE id_peluqueria = ?',
        [idPeluqueria]
    );
    if (pelu.length === 0) return null;
    const horario = pelu[0].horario;

    let query = `
        SELECT 
            r.id_reserva, 
            r.id_usuario,
            r.notas,
            DATE_FORMAT(r.fecha_reserva, '%H:%i') as hora_reserva, 
            u.nombre as nombre_cliente, 
            r.estado 
        FROM reservas_peluqueria r
        JOIN usuario u ON r.id_usuario = u.id_usuario
        WHERE r.id_peluqueria = ? 
          AND DATE(r.fecha_reserva) = ? 
          AND r.estado != 'CANCELADA'
    `;

    const params: any[] = [idPeluqueria, fecha];

    // FILTRADO LÓGICO SEGÚN ROL
    if (rol === 'PERSONAL') {
        // Si es empleado, filtramos por SU id_personal
        query += ` AND r.id_personal_asignado = (SELECT id_personal FROM personal WHERE id_usuario = ?)`;
        params.push(idUsuario);
    }
    // SI ES DUEÑO: No añadimos más filtros, así ve TODAS las citas de su peluquería.

    query += ` ORDER BY r.fecha_reserva ASC`;

    const [reservas]: any = await pool.execute(query, params);

    return { horario, reservas };
};

export const cancelarReservaService = async (idReserva: number, idPeluqueria: number) => {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // Buscamos id_usuario y fecha_reserva (nombre de columna correcto)
        const [rows]: any = await connection.execute(
            'SELECT id_usuario, fecha_reserva FROM reservas_peluqueria WHERE id_reserva = ? AND id_peluqueria = ?',
            [idReserva, idPeluqueria]
        );

        if (rows.length === 0) {
            await connection.rollback();
            return false;
        }

        const { id_usuario, fecha_reserva } = rows[0];

        // Marcamos la reserva como CANCELADA
        const [result]: any = await connection.execute(
            `UPDATE reservas_peluqueria 
             SET estado = 'CANCELADA' 
             WHERE id_reserva = ? AND id_peluqueria = ?`,
            [idReserva, idPeluqueria]
        );

        if (result.affectedRows > 0) {
            // 3. Insertamos la notificación con la fecha formateada
            const fechaCita = new Date(fecha_reserva).toLocaleDateString('es-ES');
            const mensaje = `Tu cita para el día ${fechaCita} ha sido cancelada`;

            await connection.execute(
                'INSERT INTO notificaciones (mensaje, fecha, id_usuario) VALUES (?, NOW(), ?)',
                [mensaje, id_usuario]
            );
        }

        await connection.commit();
        return result.affectedRows > 0;

    } catch (error) {
        // Si hay error, intentamos hacer rollback si la conexión existe
        if (connection) await connection.rollback();
        console.error("Error en cancelarReservaService:", error);
        throw error;
    } finally {
        // Liberamos siempre la conexión al pool
        if (connection) connection.release();
    }
};

export const buscarClientePorEmailService = async (email: string): Promise<UsuarioBusqueda | null> => {
    const query = 'SELECT id_usuario, nombre, apellido_1 FROM usuario WHERE email = ? LIMIT 1';

    // Usamos el Type que definimos arriba
    const [rows] = await pool.execute<UsuarioBusqueda[]>(query, [email]);

    if (rows.length === 0) {
        return null;
    }

    return rows[0];
};

export const forzarCitaService = async (datos: ForzarCitaDTO): Promise<number> => {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // Buscamos si el usuario logueado existe en la tabla personal
        const [personalRows]: any = await connection.execute(
            'SELECT id_personal FROM personal WHERE id_usuario = ? AND id_peluqueria = ? LIMIT 1',
            [datos.id_personal_asignado, datos.id_peluqueria]
        );

        let idPersonalReal: number | null = personalRows.length > 0 
            ? personalRows[0].id_personal 
            : null;

        // Realizamos el INSERT de la reserva
        const [result] = await connection.execute<ResultSetHeader>(
            `INSERT INTO reservas_peluqueria 
            (id_peluqueria, id_usuario, fecha_reserva, id_personal_asignado, id_servicio, estado, notas) 
            VALUES (?, ?, ?, ?, ?, 'CONFIRMADA', ?)`,
            [
                datos.id_peluqueria,
                datos.id_usuario,
                datos.fecha_reserva,
                idPersonalReal,
                datos.id_servicio,
                datos.notas || null
            ]
        );

        const idNuevaReserva = result.insertId;

        // Insertamos la noti
        // Formateamos la fecha
        const fechaObj = new Date(datos.fecha_reserva);
        const fechaFormateada = fechaObj.toLocaleDateString('es-ES');
        const horaFormateada = fechaObj.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        
        const mensaje = `Reserva confirmada para el ${fechaFormateada} a las ${horaFormateada}.`;

        await connection.execute(
            'INSERT INTO notificaciones (mensaje, fecha, id_usuario) VALUES (?, NOW(), ?)',
            [mensaje, datos.id_usuario]
        );

        await connection.commit();
        return idNuevaReserva;

    } catch (error) {
        if (connection) await connection.rollback();
        console.error("❌ Error en forzarCitaService:", error);
        throw error;
    } finally {
        if (connection) connection.release();
    }
};

export const getAllServicios = async (idPeluqueria: number): Promise<DBServicioRow[]> => {
    try {
        const query = 'SELECT id_servicio, nombre_servicio, precio, CAST(activo AS UNSIGNED) as activo FROM servicios WHERE id_peluqueria = ?';
        const [rows] = await pool.query<DBServicioRow[]>(query, [idPeluqueria]);
        return rows.map((row: any) => ({
            ...row,
            activo: row.activo ? 1 : 0 
        }));

    } catch (error) {
        console.error("❌ Error en el Service getAllServicios:", error);
        throw new Error("Error al consultar los servicios de la peluquería");
    }
};

export const getServiciosAdmin = async (idPeluqueria: number): Promise<DBServicioRow[]> => {
    try {
        const query = 'SELECT id_servicio, nombre_servicio, precio, CAST(activo AS UNSIGNED) as activo FROM servicios WHERE id_peluqueria = ?';
        const [rows] = await pool.query<DBServicioRow[]>(query, [idPeluqueria]);
        return rows.map((row: any) => ({
            ...row,
            activo: row.activo ? 1 : 0
        }));
    } catch (error) {
        console.error("❌ Error en getServiciosAdmin:", error);
        throw new Error("Error al obtener el historial de servicios");
    }
};


export const syncServiciosService = async (idPeluqueria: number, servicios: any[]): Promise<void> => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        for (const servicio of servicios) {
            const nombre = servicio.nombre_servicio.trim();
            const precio = parseFloat(servicio.precio) || 0;
            const activoVal = (servicio.activo === 1 || servicio.activo === true || servicio.activo === '1') ? 1 : 0;

            if (servicio.id_servicio) {
                await connection.execute(
                    `UPDATE servicios SET nombre_servicio = ?, precio = ?, activo = ? 
                     WHERE id_servicio = ? AND id_peluqueria = ?`,
                    [nombre, precio, activoVal, servicio.id_servicio, idPeluqueria]
                );
            } else {
                await connection.execute(
                    `INSERT INTO servicios (nombre_servicio, precio, id_peluqueria, activo) 
                     VALUES (?, ?, ?, ?)
                     ON DUPLICATE KEY UPDATE precio = VALUES(precio), activo = VALUES(activo)`,
                    [nombre, precio, idPeluqueria, activoVal]
                );
            }
        }

        await connection.commit();
    } catch (error) {
        if (connection) await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};