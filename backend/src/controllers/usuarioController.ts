import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import {
    findUsuarioByEmailParaLogin,
    getPeluqueriaByPersonalId,
    findUsuarioByEmail,
    createUsuario,
    getUsuarioBasicoById,
    updateUsuarioFull,
    getPerfilCompletoById,
    findUsuarioActivoByEmail,
    updateUsuarioPasswordById,
    getCitasByUsuarioId,
    subirImagenCabeceraService
} from '../services/usuarioService';
import { getPeluqueriaByDuenoId } from '../services/userJService';
import { AuthRequest } from '../middlewares/authMiddleware';
import { UpdatePerfilDTO } from '../types/usuarioType'; 
import { sendMail } from '../utils/smtpMailer';
import { resetPasswordTemplate } from '../utils/resetPasswordTemplate';

export const login = async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const jwtSecret = process.env.JWT_SECRET || 'tu_clave_secreta';

    if (!email || !password) {
        return res.status(400).json({ ok: false, message: 'Email y contraseña obligatorios' });
    }

    try {
        const usuario = await findUsuarioByEmailParaLogin(email);

        if (!usuario) {
            return res.status(401).json({ ok: false, message: 'Credenciales incorrectas' });
        }

        const passwordCorrecta = await bcrypt.compare(password, usuario.password);

        if (!passwordCorrecta) {
            return res.status(401).json({ ok: false, message: 'Credenciales incorrectas' });
        }

        let idPeluqueria = null;
        if (usuario.rol === 'DUEÑO') {
            idPeluqueria = await getPeluqueriaByDuenoId(usuario.id_usuario);
        } else if (usuario.rol === 'PERSONAL') {
            idPeluqueria = await getPeluqueriaByPersonalId(usuario.id_usuario);
        }

        const token = jwt.sign(
            {
                id: usuario.id_usuario,
                rol: usuario.rol,
                idPeluqueria: idPeluqueria
            },
            jwtSecret,
            { expiresIn: '24h' }
        );

        return res.json({
            ok: true,
            token,
            usuario: {
                id_usuario: usuario.id_usuario,
                nombre: usuario.nombre,
                rol: usuario.rol,
                idPeluqueria: idPeluqueria
            }
        });

    } catch (error) {
        console.error("❌ Error en Login Controller:", error);
        return res.status(500).json({ ok: false, message: 'Error interno del servidor' });
    }
};

export const registro = async (req: Request, res: Response) => {
    const { nombre, apellido_1, apellido_2, email, password, ubicacion, rol, cif } = req.body;

    if (!nombre || !apellido_1 || !email || !password || !rol) {
        return res.status(400).json({ ok: false, message: 'Faltan campos obligatorios' });
    }

    try {
        const existente = await findUsuarioByEmail(email);

        if (existente) {
            return res.status(409).json({ ok: false, message: 'Este email ya está registrado' });
        }

        await createUsuario(
            nombre,
            apellido_1,
            apellido_2,
            email,
            password,
            rol,
            ubicacion, 
            cif
        );

        return res.status(201).json({ ok: true, message: 'Usuario registrado correctamente' });

    } catch (error) {
        console.error('❌ Error en registro:', error);
        return res.status(500).json({ ok: false, message: 'Error interno del servidor' });
    }
};

export const solicitarResetPassword = async (req: Request, res: Response) => {
    const { email } = req.body as { email?: string };

    if (!email || !email.trim()) {
        return res.status(400).json({ ok: false, message: 'El email es obligatorio' });
    }

    try {
        const usuario = await findUsuarioActivoByEmail(email.trim().toLowerCase());
        if (!usuario) {
            return res.json({
                ok: true,
                message: 'Si el correo existe, te enviaremos un enlace de recuperacion.',
            });
        }

        const resetSecret = process.env.RESET_PASSWORD_TOKEN_SECRET || process.env.JWT_SECRET || 'tu_clave_secreta';
        const expiresIn = (process.env.RESET_PASSWORD_TOKEN_EXPIRES || '20m') as jwt.SignOptions['expiresIn'];
        const frontendUrl = process.env.FRONTEND_URL || 'http://altioram.work.gd';

        const token = jwt.sign(
            { id: usuario.id_usuario, purpose: 'reset-password' },
            resetSecret,
            { expiresIn }
        );

        const resetUrl = `${frontendUrl}/reset-password?token=${token}`;
        const template = resetPasswordTemplate({ nombre: usuario.nombre, resetUrl });

        await sendMail({
            to: usuario.email,
            subject: template.subject,
            text: template.text,
            html: template.html,
        });

        return res.json({
            ok: true,
            message: 'Si el correo existe, te enviaremos un enlace de recuperacion.',
        });
    } catch (error) {
        console.error('❌ Error en solicitarResetPassword:', error);
        return res.status(500).json({ ok: false, message: 'No se pudo enviar el correo de recuperacion' });
    }
};

export const confirmarResetPassword = async (req: Request, res: Response) => {
    const { token, password } = req.body as { token?: string; password?: string };

    if (!token || !password) {
        return res.status(400).json({ ok: false, message: 'Token y nueva contrasena son obligatorios' });
    }

    if (password.length < 4) {
        return res.status(400).json({ ok: false, message: 'La contrasena debe tener al menos 4 caracteres' });
    }

    try {
        const resetSecret = process.env.RESET_PASSWORD_TOKEN_SECRET || process.env.JWT_SECRET || 'tu_clave_secreta';
        const decoded = jwt.verify(token, resetSecret) as { id?: number; purpose?: string };

        if (!decoded?.id || decoded.purpose !== 'reset-password') {
            return res.status(400).json({ ok: false, message: 'Token de recuperacion no valido' });
        }

        await updateUsuarioPasswordById(decoded.id, password);
        return res.json({ ok: true, message: 'Contrasena actualizada correctamente' });
    } catch (error) {
        console.error('❌ Error en confirmarResetPassword:', error);
        return res.status(400).json({ ok: false, message: 'Token invalido o expirado' });
    }
};

/**
 * Función original: Mantenida para compatibilidad
 */
export const getPerfilBasico = async (req: AuthRequest, res: Response) => {
    try {
        const idUsuario = req.usuario?.id;

        if (!idUsuario) {
            return res.status(401).json({ ok: false, message: 'Usuario no autenticado' });
        }

        const perfil = await getUsuarioBasicoById(idUsuario);

        if (!perfil) {
            return res.status(404).json({ ok: false, message: 'Usuario no encontrado' });
        }

        return res.json({ ok: true, perfil });
    } catch (error) {
        console.error("❌ Error en getPerfilBasico:", error);
        return res.status(500).json({ ok: false, message: 'Error interno del servidor' });
    }
};

/**
 * Obtiene el perfil completo (Usuario + Peluquería si es Dueño)
 * Esta es la que llamará useEffect en la vista de Ajustes
 */
export const getPerfil = async (req: AuthRequest, res: Response) => {
    try {
        const idUsuario = req.usuario?.id;
        const rol = req.usuario?.rol;

        if (!idUsuario || !rol) {
            return res.status(401).json({ ok: false, message: 'Usuario no autenticado' });
        }

        const perfil = await getPerfilCompletoById(idUsuario, rol);

        if (!perfil) {
            return res.status(404).json({ ok: false, message: 'Perfil no encontrado' });
        }

        return res.json({ ok: true, perfil });
    } catch (error) {
        console.error("❌ Error en getPerfil:", error);
        return res.status(500).json({ ok: false, message: 'Error interno del servidor' });
    }
};

/**
 * Actualiza todos los datos del perfil según el rol
 * Esta es la que llamará el botón "Guardar" de Ajustes
 */
export const actualizarPerfil = async (req: AuthRequest, res: Response) => {
    try {
        const idUsuario = req.usuario?.id;
        const rol = req.usuario?.rol;
        const datos = req.body;

        if (!idUsuario || !rol) return res.status(401).json({ ok: false, message: 'No autorizado' });

        // Control estricto de tipo de vía para DUEÑO
        if (rol.toUpperCase() === 'DUEÑO' && datos.tipo_de_via) {
            const viasPermitidas = ['CALLE', 'AVENIDA', 'PASEO', 'PLAZA', 'VIA', 'RONDA', 'BULEVAR', 'CARRETERA'];
            const viaInput = datos.tipo_de_via.toUpperCase().trim();

            if (!viasPermitidas.includes(viaInput)) {
                return res.status(400).json({ 
                    ok: false, 
                    message: `Tipo de vía no válido. Debe ser uno de estos: ${viasPermitidas.join(', ')}` 
                });
            }
            // primera mayúscula, resto minúscula (ej: Calle)
            datos.tipo_de_via = viaInput.charAt(0) + viaInput.slice(1).toLowerCase();
        }

        await updateUsuarioFull(idUsuario, rol, datos);
        return res.json({ ok: true, message: 'Perfil actualizado correctamente' });
    } catch (error) {
        return res.status(500).json({ ok: false, message: 'Error interno del servidor' });
    }
};

export const subirImagenCabecera = async (req: AuthRequest, res: Response) => {
    try {
        const idUsuario = req.usuario?.id;

        if (!idUsuario) {
            return res.status(401).json({ ok: false, message: 'Usuario no autenticado' });
        }

        if (!req.file) {
            return res.status(400).json({ ok: false, message: 'No se ha seleccionado ninguna imagen.' });
        }

        const rol = req.usuario?.rol ?? '';
        const imagenUrl = await subirImagenCabeceraService(idUsuario, req.file.buffer, rol);

        return res.json({ ok: true, imagenUrl });
    } catch (error) {
        console.error('❌ Error en subirImagenCabecera:', error);
        return res.status(500).json({ ok: false, message: 'Error al subir la imagen de cabecera.' });
    }
};

export const getCitasUsuario = async (req: AuthRequest, res: Response) => {
    const idUsuario = req.usuario?.id;

    if (!idUsuario) {
        return res.status(401).json({ ok: false, message: 'Usuario no autenticado' });
    }

    try {
        const citas = await getCitasByUsuarioId(idUsuario);
        return res.json({ ok: true, citas });
    } catch (error) {
        console.error('❌ Error en getCitasUsuario:', error);
        return res.status(500).json({ ok: false, message: 'Error interno del servidor' });
    }
};

