import pool from '../database';
import { Usuario, UpdatePerfilDTO } from '../types/usuarioType';
import bcrypt from 'bcryptjs';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import cloudinary from '../config/cloudinary';
import { CloudinaryUploadResponse } from '../types/crearPostType';

export const findUsuarioByEmailParaLogin = async (email: string): Promise<any | null> => {
  // IMPORTANTE: Ahora pedimos la columna 'password' (que es el hash) 
  // y NO filtramos por password en el WHERE
  const [rows]: any = await pool.execute(
    'SELECT id_usuario, nombre, email, password, rol FROM usuario WHERE email = ? AND activo = 1',
    [email]
  );
  return rows[0] || null;
};

export const findUsuarioByEmail = async (email: string): Promise<Pick<Usuario, 'id_usuario'> | null> => {
  const [rows]: any = await pool.execute(
    'SELECT id_usuario FROM usuario WHERE email = ? AND activo = 1',
    [email]
  );
  return rows[0] || null;
};

// usuarioService.ts
export const createUsuario = async (
  nombre: string,
  apellido_1: string,
  apellido_2: string | null,
  email: string,
  password: string,
  rol: string,
  ubicacion: string | null,
  cif: string
): Promise<void> => {

  // 1. Pedimos una conexión específica para asegurar que todo vaya por el mismo "hilo"
  const connection = await pool.getConnection(); 
  
  try {
    // 2. Iniciamos la transacción: "O se hace todo, o no se hace nada"
    await connection.beginTransaction(); 

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const rolFormateado = rol.toUpperCase();

    // INSERT DE USUARIO
    const [resUser] = await connection.execute<ResultSetHeader>(
      `INSERT INTO usuario (nombre, apellido_1, apellido_2, email, password, rol, ubicacion, warnings, activo)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, 1)`,
      [nombre, apellido_1, apellido_2 || null, email, hashedPassword, rolFormateado, ubicacion || null]
    );
    const nuevoIdUsuario = resUser.insertId;

    if (rol.toUpperCase() === 'DUEÑO') {
      // INSERT DE PELUQUERÍA
      const [resPelu] = await connection.execute<ResultSetHeader>(
        `INSERT INTO peluqueria 
        (nombre_empresa, cif, id_dueno, calle, tipo_de_via, codigo_postal, puntuacion, solicitud_baja) 
        VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
        [`Negocio de ${nombre}`, cif, nuevoIdUsuario, 'Por definir', 'Calle', '00000', 0.0]
      );

      const nuevoIdPeluqueria = resPelu.insertId;

      // INSERT DE PRODUCTO (Asegúrate que el ID 210001 existe en la tabla productos)
      await connection.execute(
        `INSERT INTO tienda_negocio 
        (id_producto, descripcion, id_peluqueria, precio_local, stock_actual, stock_minimo, disponibilidad, venta_publico) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [210001, 'Producto inicial de bienvenida', nuevoIdPeluqueria, 10.00, 10, 2, 1, 1]
      );
    }

    // 3. Si todo ha llegado hasta aquí, confirmamos los cambios
    await connection.commit(); 
    console.log("Registro completo y seguro realizado.");

  } catch (error) {
    // 4. Si el internet falló o hubo un error de ID, deshacemos TODO
    if (connection) await connection.rollback();
    console.error("ERROR EN EL REGISTRO (Se ha hecho rollback):", error);
    throw error; // Esto hará que el Frontend reciba el error correctamente
  } finally {
    // 5. Liberamos la conexión SIEMPRE
    if (connection) connection.release();
  }
};

export const getPerfilCompletoById = async (idUsuario: number, rol: string) => {
  if (rol.toUpperCase() === 'DUEÑO') {
    const [rows]: any = await pool.execute(
      `SELECT u.nombre, u.email, u.rol, u.imagenCabecera, p.nombre_empresa, p.horario,
              p.tipo_de_via, p.calle, p.codigo_postal, p.numero_seguidores
       FROM usuario u
       LEFT JOIN peluqueria p ON u.id_usuario = p.id_dueno
       WHERE u.id_usuario = ?`,
      [idUsuario]
    );
    return rows[0] || null;
  } else {
    const [rows]: any = await pool.execute(
      `SELECT u.nombre, u.email, u.rol, u.ubicacion, u.imagenCabecera,
       (SELECT COUNT(*) FROM usuario_peluqueria_favorita WHERE id_usuario = u.id_usuario) as favoritos_count,
       (SELECT COUNT(*) FROM peluqueria_seguidores WHERE id_usuario = u.id_usuario) as seguidas_count
       FROM usuario u
       WHERE u.id_usuario = ?`,
      [idUsuario]
    );
    return rows[0] || null;
  }
};

/**
 * Actualiza los datos del usuario y de la peluquería (si aplica)
 */
export const updateUsuarioFull = async (idUsuario: number, rol: string, data: UpdatePerfilDTO) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Siempre actualizamos datos básicos del usuario
    await connection.execute(
      'UPDATE usuario SET nombre = ?, email = ? WHERE id_usuario = ?',
      [data.nombre, data.email, idUsuario]
    );

    if (rol.toUpperCase() === 'DUEÑO') {
      // Si es DUEÑO, actualizamos la tabla PELUQUERIA (calle, vía, CP)
      await connection.execute(
        `UPDATE peluqueria SET nombre_empresa = ?, horario = ?, tipo_de_via = ?, calle = ?, codigo_postal = ? 
         WHERE id_dueno = ?`,
        [data.nombre_empresa || null, data.horario || null, data.tipo_de_via || null, data.calle || null, data.codigo_postal || null, idUsuario]
      );
    } else {
      // Si es NORMAL, actualizamos su ubicación en la tabla USUARIO
      await connection.execute(
        'UPDATE usuario SET ubicacion = ? WHERE id_usuario = ?',
        [data.ubicacion || null, idUsuario]
      );
    }

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export const getPeluqueriaByPersonalId = async (usuarioId: number): Promise<number | null> => {
  const [rows]: any = await pool.execute('SELECT id_peluqueria FROM personal WHERE id_usuario = ?', [usuarioId]);
  return rows.length === 0 ? null : rows[0].id_peluqueria;
};

export const getUsuarioBasicoById = async (idUsuario: number): Promise<any | null> => {
  const [rows]: any = await pool.execute('SELECT nombre, email FROM usuario WHERE id_usuario = ?', [idUsuario]);
  return rows[0] || null;
};

export const findUsuarioActivoByEmail = async (
  email: string
): Promise<{ id_usuario: number; nombre: string; email: string } | null> => {
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT id_usuario, nombre, email FROM usuario WHERE email = ? AND activo = 1 LIMIT 1',
    [email]
  );

  if (!rows.length) {
    return null;
  }

  return {
    id_usuario: Number(rows[0].id_usuario),
    nombre: String(rows[0].nombre),
    email: String(rows[0].email),
  };
};

export const updateUsuarioPasswordById = async (idUsuario: number, newPassword: string): Promise<void> => {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  await pool.execute('UPDATE usuario SET password = ? WHERE id_usuario = ?', [hashedPassword, idUsuario]);
};

export type CitaUsuarioResumen = {
  idPeluqueria: number;
  peluqueria: string;
  fecha: string;
  hora: string | null;
  servicio: string | null;
  empleado: string | null;
  estado: string | null;
};

type DBCitaUsuarioRow = RowDataPacket & {
  id_peluqueria: number;
  peluqueria: string;
  fecha: string;
  hora: string | null;
  servicio: string | null;
  empleado: string | null;
  estado: string | null;
};

export const subirImagenCabeceraService = async (idUsuario: number, buffer: Buffer, rol: string): Promise<string> => {
  const uploadResult = await new Promise<CloudinaryUploadResponse>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'cabeceras_altioram' },
      (error, result) => {
        if (error || !result) reject(error);
        else resolve(result as CloudinaryUploadResponse);
      }
    );
    stream.end(buffer);
  });

  await pool.execute(
    'UPDATE usuario SET imagenCabecera = ? WHERE id_usuario = ?',
    [uploadResult.secure_url, idUsuario]
  );

  if (rol.toUpperCase() === 'DUEÑO') {
    await pool.execute(
      'UPDATE peluqueria SET imagen = ? WHERE id_dueno = ?',
      [uploadResult.secure_url, idUsuario]
    );
  }

  return uploadResult.secure_url;
};

export const getCitasByUsuarioId = async (idUsuario: number): Promise<CitaUsuarioResumen[]> => {
  const [rows] = await pool.query<DBCitaUsuarioRow[]>(
    `
      SELECT
        r.id_peluqueria,
        p.nombre_empresa AS peluqueria,
        DATE_FORMAT(r.fecha_reserva, '%d/%m/%Y') AS fecha,
        DATE_FORMAT(r.fecha_reserva, '%H:%i') AS hora,
        s.nombre_servicio AS servicio,
        TRIM(CONCAT_WS(' ', u.nombre, u.apellido_1, u.apellido_2)) AS empleado,
        r.estado
      FROM reservas_peluqueria r
      LEFT JOIN peluqueria p ON p.id_peluqueria = r.id_peluqueria
      LEFT JOIN servicios s ON s.id_servicio = r.id_servicio
      LEFT JOIN personal pe ON pe.id_personal = r.id_personal_asignado
      LEFT JOIN usuario u ON u.id_usuario = pe.id_usuario
      WHERE r.id_usuario = ?
      ORDER BY r.fecha_reserva DESC
    `,
    [idUsuario]
  );

  return rows.map((row) => ({
    idPeluqueria: Number(row.id_peluqueria),
    peluqueria: row.peluqueria ?? 'Peluqueria',
    fecha: row.fecha ?? '',
    hora: row.hora ?? null,
    servicio: row.servicio ?? null,
    empleado: row.empleado?.trim() || null,
    estado: row.estado ?? null,
  }));
};